// Builds the full sticker catalog from the country data file plus the two
// special sets. No card data is hard-coded here beyond the set definitions —
// the country roster lives in /data/countries.json.
import countries from "../data/countries.json";

// Each country gets this many numbered stickers.
export const STICKERS_PER_COUNTRY = 20;

// Special sets. `count` is how many stickers; `start` is the first number
// (defaults to 1). FWC runs 0..19, CC runs 1..12.
export const SPECIAL_SETS = [
  { code: "FWC", name: "FIFA World Cup Stickers", count: 20, start: 0, emoji: "🏆" },
  { code: "CC", name: "Coca-Cola", count: 12, emoji: "🥤" },
];

// Convert a `unicode` field into an emoji string. Accepts:
//   "U+1F1FA U+1F1F8"  |  "1F1FA 1F1F8"  |  raw emoji "🇺🇸"
function toEmoji(unicode) {
  if (!unicode) return "";
  // Already an emoji (no hex code-point tokens)?
  if (!/[0-9a-fA-F]{2,}/.test(unicode.replace(/U\+/gi, ""))) return unicode;
  try {
    const points = unicode
      .trim()
      .split(/\s+/)
      .map((p) => parseInt(p.replace(/^U\+/i, ""), 16))
      .filter((n) => Number.isFinite(n));
    return points.length ? String.fromCodePoint(...points) : unicode;
  } catch {
    return unicode;
  }
}

// A "set" is a country or a special set. Returns an ordered list of sets,
// each with its full list of cards.
export function buildCatalog() {
  const sets = [];

  const countrySets = [];
  for (const c of countries) {
    if (!c || !c.code || !c.name) continue;
    const code = String(c.code).toUpperCase();
    const emoji = toEmoji(c.unicode);
    const group = c.group != null && String(c.group).trim() !== "" ? String(c.group).trim() : null;
    const draw = c.draw != null && c.draw !== "" && Number.isFinite(Number(c.draw)) ? Number(c.draw) : null;
    const cards = [];
    for (let n = 1; n <= STICKERS_PER_COUNTRY; n++) {
      cards.push({ id: `${code}${n}`, set: code, number: n, name: `${c.name} #${n}` });
    }
    countrySets.push({ code, name: c.name, emoji, group, draw, kind: "country", total: cards.length, cards });
  }

  // Sort countries by group, then by draw position, then alphabetically by name.
  // Ungrouped countries and those without a draw position sort last.
  countrySets.sort((a, b) => {
    if (a.group !== b.group) {
      if (a.group == null) return 1;
      if (b.group == null) return -1;
      const g = a.group.localeCompare(b.group, undefined, { numeric: true, sensitivity: "base" });
      if (g) return g;
    }
    if (a.draw !== b.draw) {
      if (a.draw == null) return 1;
      if (b.draw == null) return -1;
      return a.draw - b.draw;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  sets.push(...countrySets);

  for (const s of SPECIAL_SETS) {
    const code = s.code.toUpperCase();
    const start = s.start ?? 1;
    const cards = [];
    for (let n = start; n < start + s.count; n++) {
      cards.push({ id: `${code}${n}`, set: code, number: n, name: `${s.name} #${n}` });
    }
    sets.push({ code, name: s.name, emoji: s.emoji, group: null, draw: null, kind: "special", total: cards.length, cards });
  }

  return sets;
}

// Fast lookup: card id -> card. Used to validate check-ins.
let _index = null;
export function cardIndex() {
  if (_index) return _index;
  _index = new Map();
  for (const set of buildCatalog()) {
    for (const card of set.cards) _index.set(card.id, card);
  }
  return _index;
}

// Parse & validate a typed code like "USA1" or "fwc12".
// Returns the canonical card id, or null if it isn't a real card.
export function normalizeCode(input) {
  if (!input) return null;
  const m = String(input).trim().toUpperCase().match(/^([A-Z]+)\s*-?\s*(\d+)$/);
  if (!m) return null;
  const id = `${m[1]}${parseInt(m[2], 10)}`;
  return cardIndex().has(id) ? id : null;
}
