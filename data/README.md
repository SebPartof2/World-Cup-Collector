# Card data

`countries.json` is the source of truth for the country sticker catalog. It ships
**empty** — fill it with the real teams. Each entry looks like:

```json
[
  { "name": "United States", "code": "USA", "unicode": "U+1F1FA U+1F1F8", "group": "A", "draw": 1 }
]
```

| Field     | Meaning                                                                 |
| --------- | ---------------------------------------------------------------------- |
| `name`    | Display name of the country / team.                                     |
| `code`    | Short sticker code, used as the check-in prefix (e.g. `USA` → `USA1`).  |
| `unicode` | Unicode code point(s) for the flag emoji. Space-separated, `U+XXXX` or raw `1F1FA`. You may also just put the emoji character directly. |
| `group`   | *(optional)* Group label, e.g. `"A"`. Stats are rolled up per group. Omit it (or leave blank) to leave a team ungrouped — ungrouped teams sort last. |
| `draw`    | *(optional)* Draw position within the group (e.g. `1`–`4`). Teams sort by group, then draw position, then name. Teams without a draw position sort last within their group. |

Each country automatically gets **20** numbered stickers (`CODE1`..`CODE20`).

The two special sets are generated in code (see `src/catalog.js`):

- **FWC** — FIFA World Cup stickers, `FWC0`..`FWC19` (20 cards)
- **CC** — Coca-Cola, `CC1`..`CC12` (12 cards)
