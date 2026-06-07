# World-Cup-Collector

A sticker-collection tracker for the World Cup, running entirely on a
**Cloudflare Worker + D1** (no Pages). The Worker serves both the API and the
single-page UI; D1 stores one collection.

## Features

- **Card catalog** built from `data/countries.json` — every country gets **20**
  numbered stickers (`USA1`…`USA20`).
- **Groups & draw positions** — give a country a `group` (e.g. `"A"`) and a
  `draw` position (e.g. `1`–`4`); teams are sorted by group, then draw position,
  then name, and stats roll up to a per-group level.
- **Special sets** built in:
  - `FWC` — FIFA World Cup Stickers (20 cards, `FWC0`…`FWC19`)
  - `CC` — Coca-Cola (12 cards, `CC1`…`CC12`)
- **Quick check-in** — just type a code like `USA1`, `FWC12`, or `CC3` and hit
  enter. Case-insensitive, validated against the catalog.
- **Album page numbers** — give each set an album page number right in the
  collector UI (the 📄 field on every set header). It's stored in D1 and shown
  big in mass check-in mode so you know which page to flip to.
- **Mass check-in mode** (`/mass`) — a full-screen, scan-style entry screen. Type
  a code big, hit enter, and the whole screen flashes a colour-coded verdict:
  **green “New!”** (shows that country’s sticker matrix), **amber “Duplicate”**
  (shows how many you have), or **red “Invalid”**. Any key/tap returns you to the
  input for the next code, with a running new/dupe/invalid tally.
- **Duplicate / swap tracking** — checking in a card you already own bumps its
  count so you know what you can trade.
- **Duplicates list** — a dedicated swaps panel lists every card you own more
  than one of (with spare counts); click a chip to remove a spare after a trade.
  Also exposed as `GET /api/duplicates`.
- **Stats dashboard** — total collected, % complete, missing, duplicates,
  countries finished, sets finished, plus per-set progress.
- **One collection**, stored in D1.

## Card data

`data/countries.json` ships **empty** — you populate it. Schema and emoji
formats are documented in [`data/README.md`](data/README.md):

```json
[
  { "name": "United States", "code": "USA", "unicode": "U+1F1FA U+1F1F8", "group": "A", "draw": 1 }
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
| GET    | `/mass`        | —                                     | Full-screen mass check-in screen     |
| GET    | `/api/cards`   | —                                     | Full catalog with owned counts       |
| GET    | `/api/stats`   | —                                     | Aggregate + per-set stats            |
| GET    | `/api/duplicates` | —                                  | Cards owned >1, with spare counts    |
| POST   | `/api/checkin` | `{ "code": "USA1", "delta": 1 }`      | Check in (`delta: -1` to remove one) |
| POST   | `/api/page`    | `{ "code": "USA", "page": "12" }`     | Set/clear a set's album page number   |
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
