import { buildCatalog, normalizeCode, SPECIAL_SETS } from "./catalog.js";
import { renderPage } from "./ui.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Lazily ensure the table exists so a fresh D1 works without a separate step.
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS stickers (
         card_id TEXT PRIMARY KEY,
         count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
         updated_at TEXT NOT NULL
       )`
    )
    .run();
  schemaReady = true;
}

// Map of card_id -> owned count.
async function loadOwned(db) {
  const { results } = await db.prepare("SELECT card_id, count FROM stickers WHERE count > 0").all();
  const owned = new Map();
  for (const r of results) owned.set(r.card_id, r.count);
  return owned;
}

function computeStats(catalog, owned) {
  let totalCards = 0;
  let collected = 0;
  let duplicates = 0;
  const sets = [];

  for (const set of catalog) {
    let setCollected = 0;
    let setDupes = 0;
    for (const card of set.cards) {
      const n = owned.get(card.id) || 0;
      if (n > 0) {
        setCollected++;
        setDupes += n - 1;
      }
    }
    totalCards += set.total;
    collected += setCollected;
    duplicates += setDupes;
    sets.push({
      code: set.code,
      name: set.name,
      emoji: set.emoji,
      group: set.group,
      kind: set.kind,
      total: set.total,
      collected: setCollected,
      duplicates: setDupes,
      complete: setCollected === set.total,
    });
  }

  const countrySets = sets.filter((s) => s.kind === "country");

  // Roll set stats up to the group level (countries only).
  const groupMap = new Map();
  for (const s of countrySets) {
    if (s.group == null) continue;
    let g = groupMap.get(s.group);
    if (!g) {
      g = { group: s.group, countries: 0, total: 0, collected: 0, duplicates: 0, countriesComplete: 0 };
      groupMap.set(s.group, g);
    }
    g.countries++;
    g.total += s.total;
    g.collected += s.collected;
    g.duplicates += s.duplicates;
    if (s.complete) g.countriesComplete++;
  }
  const groups = [...groupMap.values()]
    .map((g) => ({
      ...g,
      missing: g.total - g.collected,
      percent: g.total ? Math.round((g.collected / g.total) * 1000) / 10 : 0,
      complete: g.collected === g.total,
    }))
    .sort((a, b) => a.group.localeCompare(b.group, undefined, { numeric: true, sensitivity: "base" }));

  return {
    totalCards,
    collected,
    missing: totalCards - collected,
    duplicates,
    percent: totalCards ? Math.round((collected / totalCards) * 1000) / 10 : 0,
    setsComplete: sets.filter((s) => s.complete).length,
    setsTotal: sets.length,
    countriesComplete: countrySets.filter((s) => s.complete).length,
    countriesTotal: countrySets.length,
    groupsComplete: groups.filter((g) => g.complete).length,
    groupsTotal: groups.length,
    groups,
    sets,
  };
}

async function handleApi(request, env, path) {
  const db = env.DB;
  await ensureSchema(db);
  const catalog = buildCatalog();

  // GET /api/cards — full catalog merged with owned counts.
  if (path === "/api/cards" && request.method === "GET") {
    const owned = await loadOwned(db);
    const sets = catalog.map((set) => ({
      code: set.code,
      name: set.name,
      emoji: set.emoji,
      group: set.group,
      kind: set.kind,
      total: set.total,
      cards: set.cards.map((c) => ({ ...c, count: owned.get(c.id) || 0 })),
    }));
    return json({ sets });
  }

  // GET /api/stats
  if (path === "/api/stats" && request.method === "GET") {
    const owned = await loadOwned(db);
    return json(computeStats(catalog, owned));
  }

  // POST /api/checkin  { code: "USA1", delta?: 1 }
  // Quick check-in: increments (or decrements with delta:-1) the owned count.
  if (path === "/api/checkin" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const id = normalizeCode(body.code);
    if (!id) return json({ error: `Unknown sticker code: ${body.code ?? ""}` }, 404);

    const delta = body.delta === -1 ? -1 : 1;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO stickers (card_id, count, updated_at)
         VALUES (?1, MAX(0, ?2), ?3)
         ON CONFLICT(card_id) DO UPDATE SET
           count = MAX(0, count + ?2),
           updated_at = ?3`
      )
      .bind(id, delta, now)
      .run();

    const row = await db.prepare("SELECT count FROM stickers WHERE card_id = ?1").bind(id).first();
    const count = row ? row.count : 0;
    return json({ ok: true, card_id: id, count, isNew: delta === 1 && count === 1 });
  }

  // POST /api/reset — clears the whole collection.
  if (path === "/api/reset" && request.method === "POST") {
    await db.prepare("DELETE FROM stickers").run();
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
      try {
        return await handleApi(request, env, path);
      } catch (err) {
        return json({ error: String(err && err.message ? err.message : err) }, 500);
      }
    }

    if (path === "/" || path === "") {
      return new Response(renderPage({ specialSets: SPECIAL_SETS }), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
