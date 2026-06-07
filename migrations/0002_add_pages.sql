-- 0002 — add album page numbers per set (team / special set).
-- Adds a new table only; existing collection data is untouched.
CREATE TABLE IF NOT EXISTS pages (
  set_code   TEXT PRIMARY KEY,   -- e.g. "USA", "FWC", "CC"
  page       TEXT NOT NULL,      -- free text so "12" or "12-13" both work
  updated_at TEXT NOT NULL
);
