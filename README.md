# World-Cup-Collector

A sticker-collection tracker for the World Cup, running entirely on a
**Cloudflare Worker + D1** (no Pages). The Worker serves both the API and the
single-page UI; D1 stores one collection.

## Features

- **Card catalog** built from `data/countries.json` — every country gets **20**
  numbered stickers (`USA1`…`USA20`).
- **Groups** — give a country a `group` (e.g. `"A"`); teams are sorted by group
  then alphabetically, and stats roll up to a per-group level.
- **Special sets** built in:
  - `FWC` — FIFA World Cup Stickers (19 cards, `FWC1`…`FWC19`)
  - `CC` — Coca-Cola (12 cards, `CC1`…`CC12`)
- **Quick check-in** — just type a code like `USA1`, `FWC12`, or `CC3` and hit
  enter. Case-insensitive, validated against the catalog.
- **Duplicate / swap tracking** — checking in a card you already own bumps its
  count so you know what you can trade.
- **Stats dashboard** — total collected, % complete, missing, duplicates,
  countries finished, sets finished, plus per-set progress.
- **One collection**, stored in D1.

## Card data

`data/countries.json` ships **empty** — you populate it. Schema and emoji
formats are documented in [`data/README.md`](data/README.md):

```json
[
  { "name": "United States", "code": "USA", "unicode": "U+1F1FA U+1F1F8", "group": "A" }
]
```

## Setup

```bash
npm install

# 1. Create the D1 database, then paste the printed database_id into wrangler.toml
npm run db:create

# 2. Create the table
npm run db:init            # remote
npm run db:init:local      # local dev

# 3. Run locally
npm run dev                # http://localhost:8787

# 4. Deploy
npm run deploy
```

> The Worker also creates the table on first request (`CREATE TABLE IF NOT
> EXISTS`), so `db:init` is optional but recommended.

## API

| Method | Path           | Body                                  | Description                          |
| ------ | -------------- | ------------------------------------- | ------------------------------------ |
| GET    | `/`            | —                                     | The collector UI                     |
| GET    | `/api/cards`   | —                                     | Full catalog with owned counts       |
| GET    | `/api/stats`   | —                                     | Aggregate + per-set stats            |
| POST   | `/api/checkin` | `{ "code": "USA1", "delta": 1 }`      | Check in (`delta: -1` to remove one) |
| POST   | `/api/reset`   | —                                     | Clear the whole collection           |

## Project layout

```
src/index.js          Worker: router, D1 access, stats
src/catalog.js        Builds the catalog from countries.json + FWC/CC; code parsing
src/ui.js             Single-page UI (served from the Worker)
data/countries.json   Country roster (empty — fill it in)
schema.sql            D1 table definition
wrangler.toml         Worker + D1 binding config
```
