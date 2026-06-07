-- 0001 — initial schema (the collection table).
-- Idempotent: safe to run against a database where this table already exists.
CREATE TABLE IF NOT EXISTS stickers (
  card_id    TEXT PRIMARY KEY,   -- e.g. "USA1", "FWC12", "CC3"
  count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL        -- ISO 8601 timestamp
);
