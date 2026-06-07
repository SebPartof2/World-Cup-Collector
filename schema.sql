-- World Cup Collector — single collection.
-- One row per distinct sticker the collector owns. `count` tracks duplicates
-- (count > 1 means swaps available).
CREATE TABLE IF NOT EXISTS stickers (
  card_id    TEXT PRIMARY KEY,   -- e.g. "USA1", "FWC12", "CC3"
  count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL        -- ISO 8601 timestamp
);

-- Album page number for each set (team / special set), editable in the UI.
CREATE TABLE IF NOT EXISTS pages (
  set_code   TEXT PRIMARY KEY,   -- e.g. "USA", "FWC", "CC"
  page       TEXT NOT NULL,      -- free text so "12" or "12-13" both work
  updated_at TEXT NOT NULL
);
