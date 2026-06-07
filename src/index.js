import { buildCatalog, normalizeCode, SPECIAL_SETS } from "./catalog.js";
import { renderPage, renderMassPage } from "./ui.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Lazily ensure the table exists so a fresh D1 works without a separate step.
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS stickers (
         card_id TEXT PRIMARY KEY,
         count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
         updated_at TEXT NOT NULL
       )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS pages (
         set_code TEXT PRIMARY KEY,
         page TEXT NOT NULL,
         updated_at TEXT NOT NULL
       )`
    ),
  ]);
  schemaReady = true;
}

// Map of card_id -> owned count.
async function loadOwned(db) {
  const { results } = await db.prepare("SELECT card_id, count FROM stickers WHERE count > 0").all();
  const owned = new Map();
  for (const r of results) owned.set(r.card_id, r.count);
  return owned;
}

// Map of set_code -> album page (string).
async function loadPages(db) {
  const { results } = await db.prepare("SELECT set_code, page FROM pages").all();
  const pages = new Map();
  for (const r of results) pages.set(r.set_code, r.page);
  return pages;
}

function computeStats(catalog, owned) {
  let totalCards = 0;
  let collected = 0;
  let duplicates = 0;
  // Special card types within country sets: badge = #1, picture = #13.
  // Special sets (FWC/CC) are excluded.
  let badgeTotal = 0, badgeCollected = 0;
  let pictureTotal = 0, pictureCollected = 0;
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
      if (set.kind === "country") {
        if (card.number === 1) { badgeTotal++; if (n > 0) badgeCollected++; }
        else if (card.number === 13) { pictureTotal++; if (n > 0) pictureCollected++; }
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

  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const badges = { collected: badgeCollected, total: badgeTotal, percent: pct(badgeCollected, badgeTotal) };
  const pictures = { collected: pictureCollected, total: pictureTotal, percent: pct(pictureCollected, pictureTotal) };

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
    badges,
    pictures,
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
    const [owned, pages] = await Promise.all([loadOwned(db), loadPages(db)]);
    const sets = catalog.map((set) => ({
      code: set.code,
      name: set.name,
      emoji: set.emoji,
      group: set.group,
      draw: set.draw,
      page: pages.get(set.code) || null,
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

  // GET /api/duplicates — every card owned more than once, with spares to swap.
  if (path === "/api/duplicates" && request.method === "GET") {
    const owned = await loadOwned(db);
    const cards = [];
    let totalSpares = 0;
    for (const set of catalog) {
      for (const card of set.cards) {
        const count = owned.get(card.id) || 0;
        if (count > 1) {
          const spares = count - 1;
          totalSpares += spares;
          cards.push({
            card_id: card.id,
            code: set.code,
            name: set.name,
            emoji: set.emoji,
            number: card.number,
            count,
            spares,
          });
        }
      }
    }
    return json({ totalSpares, distinct: cards.length, cards });
  }

  // POST /api/page  { code: "USA", page: "12" }
  // Set (or clear, when page is blank) the album page number for a set.
  if (path === "/api/page" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const code = String(body.code || "").trim().toUpperCase();
    if (!code || !catalog.some((s) => s.code === code)) {
      return json({ error: `Unknown set code: ${body.code ?? ""}` }, 404);
    }
    const page = String(body.page ?? "").trim();
    const now = new Date().toISOString();
    if (!page) {
      await db.prepare("DELETE FROM pages WHERE set_code = ?1").bind(code).run();
      return json({ ok: true, code, page: null });
    }
    await db
      .prepare(
        `INSERT INTO pages (set_code, page, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(set_code) DO UPDATE SET page = ?2, updated_at = ?3`
      )
      .bind(code, page, now)
      .run();
    return json({ ok: true, code, page });
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

    // Include the full set ("matrix") the card belongs to, with owned counts,
    // so the mass check-in screen can render it in one round trip.
    const set = catalog.find((s) => s.cards.some((c) => c.id === id));
    let setSnapshot = null;
    if (set) {
      const [owned, pages] = await Promise.all([loadOwned(db), loadPages(db)]);
      const collected = set.cards.filter((c) => (owned.get(c.id) || 0) > 0).length;
      setSnapshot = {
        code: set.code,
        name: set.name,
        emoji: set.emoji,
        group: set.group,
        draw: set.draw,
        page: pages.get(set.code) || null,
        kind: set.kind,
        total: set.total,
        collected,
        cards: set.cards.map((c) => ({ id: c.id, number: c.number, count: owned.get(c.id) || 0 })),
      };
    }

    return json({
      ok: true,
      card_id: id,
      number: set ? set.cards.find((c) => c.id === id).number : null,
      count,
      isNew: delta === 1 && count === 1,
      isDuplicate: delta === 1 && count > 1,
      set: setSnapshot,
    });
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
    // Normalise: drop any trailing slash and lower-case so routes are tolerant
    // of "/mass/", "/Mass", etc. (card codes live in the request body, not the
    // path, so lower-casing here is safe).
    let path = url.pathname.replace(/\/+$/, "") || "/";
    path = path.toLowerCase();

    if (path.startsWith("/api/")) {
      try {
        return await handleApi(request, env, path);
      } catch (err) {
        return json({ error: String(err && err.message ? err.message : err) }, 500);
      }
    }

    const html = (body) =>
      new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });

    if (path === "/") return html(renderPage({ specialSets: SPECIAL_SETS }));
    if (path === "/mass") return html(renderMassPage());

    return new Response("Not found", { status: 404 });
  },
};
