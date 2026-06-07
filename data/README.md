# Card data

`countries.json` is the source of truth for the country sticker catalog. It ships
**empty** — fill it with the real teams. Each entry looks like:

```json
[
  { "name": "United States", "code": "USA", "unicode": "U+1F1FA U+1F1F8", "group": "A" }
]
```

| Field     | Meaning                                                                 |
| --------- | ---------------------------------------------------------------------- |
| `name`    | Display name of the country / team.                                     |
| `code`    | Short sticker code, used as the check-in prefix (e.g. `USA` → `USA1`).  |
| `unicode` | Unicode code point(s) for the flag emoji. Space-separated, `U+XXXX` or raw `1F1FA`. You may also just put the emoji character directly. |
| `group`   | *(optional)* Group label, e.g. `"A"`. Countries are sorted by group, then alphabetically by name. Stats are also rolled up per group. Omit it (or leave blank) to leave a team ungrouped — ungrouped teams sort last. |

Each country automatically gets **20** numbered stickers (`CODE1`..`CODE20`).

The two special sets are generated in code (see `src/catalog.js`):

- **FWC** — FIFA World Cup stickers, `FWC1`..`FWC19` (19 cards)
- **CC** — Coca-Cola, `CC1`..`CC12` (12 cards)
