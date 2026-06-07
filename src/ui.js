// The entire front-end, served as one HTML document from the Worker.
// Vanilla JS + fetch against the /api endpoints. No build step, no Pages.
export function renderPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>World Cup Collector</title>
<style>
  :root {
    --bg: #0b1020; --panel: #141b30; --panel2: #1b2540; --line: #263255;
    --text: #e8ecf6; --muted: #97a3c2; --accent: #36d399; --accent2: #5b8cff;
    --gold: #f4c542; --danger: #ff6b6b;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         background: var(--bg); color: var(--text); }
  header { padding: 24px 20px 8px; text-align: center; }
  h1 { margin: 0; font-size: 26px; letter-spacing: .3px; }
  h1 span { color: var(--gold); }
  .sub { color: var(--muted); font-size: 13px; }
  main { max-width: 1100px; margin: 0 auto; padding: 16px 16px 60px; }

  .checkin { display: flex; gap: 8px; margin: 18px auto; max-width: 520px; }
  .checkin input { flex: 1; padding: 14px 16px; font-size: 18px; border-radius: 12px;
    border: 1px solid var(--line); background: var(--panel2); color: var(--text);
    text-transform: uppercase; letter-spacing: 1px; }
  .checkin input:focus { outline: 2px solid var(--accent2); }
  .checkin button { padding: 0 18px; font-size: 16px; font-weight: 600; border: 0;
    border-radius: 12px; background: var(--accent); color: #06281c; cursor: pointer; }
  .toast { text-align: center; min-height: 22px; font-size: 14px; margin-bottom: 8px; }
  .toast.ok { color: var(--accent); } .toast.dupe { color: var(--gold); }
  .toast.err { color: var(--danger); }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
    gap: 12px; margin: 18px 0; }
  .stat { background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
    padding: 14px 16px; }
  .stat .n { font-size: 26px; font-weight: 700; }
  .stat .l { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
  .bar { height: 10px; background: var(--panel2); border-radius: 6px; overflow: hidden; margin-top: 6px; }
  .bar > i { display: block; height: 100%; background: linear-gradient(90deg,var(--accent),var(--accent2)); }

  .controls { display:flex; justify-content: space-between; align-items:center; flex-wrap:wrap; gap:8px; margin: 10px 0; }
  .controls label { color: var(--muted); font-size: 13px; cursor: pointer; }
  .ghost { background: transparent; border: 1px solid var(--line); color: var(--muted);
    border-radius: 10px; padding: 7px 12px; cursor: pointer; font-size: 13px; }

  .set { background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
    margin-bottom: 14px; overflow: hidden; }
  .set-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; }
  .set-head .emoji { font-size: 22px; }
  .set-head .name { font-weight: 600; flex: 1; }
  .set-head .count { color: var(--muted); font-size: 13px; }
  .set-head .done { color: var(--accent); font-weight: 700; }
  .pill { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--panel2);
    color: var(--muted); border: 1px solid var(--line); }
  .pill.grp { color: var(--gold); border-color: #5a4a12; background: #2a2410; }

  .section { font-size: 13px; text-transform: uppercase; letter-spacing: 1px;
    color: var(--muted); margin: 22px 4px 10px; }
  .group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 12px; }
  .gcard { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; }
  .gcard.done { border-color: #2c7a55; }
  .ghead { display: flex; justify-content: space-between; align-items: baseline; }
  .gname { font-weight: 700; }
  .gpct { color: var(--accent); font-weight: 700; font-size: 13px; }
  .gmeta { color: var(--muted); font-size: 12px; margin-top: 6px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(58px,1fr));
    gap: 8px; padding: 0 14px 14px; }
  .grid.hidden { display: none; }
  .cell { aspect-ratio: 1; border-radius: 10px; border: 1px solid var(--line);
    background: var(--panel2); color: var(--muted); display:flex; flex-direction:column;
    align-items:center; justify-content:center; cursor: pointer; user-select:none; position:relative; }
  .cell .num { font-size: 14px; font-weight: 600; }
  .cell .code { font-size: 9px; opacity:.6; }
  .cell.have { background: linear-gradient(160deg,#173b2e,#1d5a3f); color: #d6ffe9;
    border-color: #2c7a55; }
  .cell.dupe::after { content: attr(data-c); position:absolute; top:-6px; right:-6px;
    background: var(--gold); color:#3a2c00; font-size:10px; font-weight:700;
    border-radius:999px; padding:1px 6px; }
  .empty { color: var(--muted); text-align:center; padding: 40px 20px; }
  .empty code { background: var(--panel2); padding: 2px 6px; border-radius: 6px; }
  footer { text-align:center; color: var(--muted); font-size: 12px; padding: 20px; }
  a { color: var(--accent2); }
</style>
</head>
<body>
<header>
  <h1>🌍 World Cup <span>Collector</span></h1>
  <div class="sub">Type a code to check in — e.g. <strong>USA1</strong>, <strong>FWC12</strong>, <strong>CC3</strong></div>
</header>
<main>
  <form class="checkin" id="checkin">
    <input id="code" name="code" placeholder="Enter sticker code…" autocomplete="off" autofocus />
    <button type="submit">Check in</button>
  </form>
  <div class="toast" id="toast"></div>

  <div class="stats" id="stats"></div>

  <div id="groups"></div>

  <div class="controls">
    <label><input type="checkbox" id="onlyMissing" /> Show only missing</label>
    <button class="ghost" id="reset">Reset collection</button>
  </div>

  <div id="sets"></div>
</main>
<footer>Worker + D1 · single collection · fill <code>data/countries.json</code> to populate teams</footer>

<script>
const $ = (s) => document.querySelector(s);
let CATALOG = { sets: [] };

async function api(path, opts) {
  const r = await fetch(path, opts);
  return r.json();
}

function flash(msg, cls) {
  const t = $("#toast"); t.textContent = msg; t.className = "toast " + (cls||"");
  if (msg) setTimeout(() => { if (t.textContent === msg) { t.textContent=""; t.className="toast"; } }, 2600);
}

async function loadStats() {
  const s = await api("/api/stats");
  const cards = [
    stat(s.collected + " / " + s.totalCards, "Stickers collected", s.percent),
    stat(s.percent + "%", "Complete"),
    stat(s.missing, "Missing"),
    stat(s.duplicates, "Duplicates / swaps"),
    stat(s.countriesComplete + " / " + s.countriesTotal, "Countries finished"),
    stat(s.setsComplete + " / " + s.setsTotal, "Sets finished"),
  ];
  if (s.groupsTotal) cards.push(stat(s.groupsComplete + " / " + s.groupsTotal, "Groups finished"));
  $("#stats").innerHTML = cards.join("");
  renderGroups(s.groups || []);
}

function renderGroups(groups) {
  const wrap = $("#groups");
  if (!groups.length) { wrap.innerHTML = ""; return; }
  wrap.innerHTML =
    '<h2 class="section">Groups</h2><div class="group-grid">' +
    groups.map((g) =>
      '<div class="gcard'+(g.complete?" done":"")+'">' +
        '<div class="ghead"><span class="gname">Group '+esc(g.group)+'</span>' +
        '<span class="gpct">'+g.percent+'%'+(g.complete?" ✓":"")+'</span></div>' +
        '<div class="bar"><i style="width:'+g.percent+'%"></i></div>' +
        '<div class="gmeta">'+g.collected+' / '+g.total+' stickers · '+
          g.countriesComplete+'/'+g.countries+' teams done</div>' +
      '</div>'
    ).join("") +
    '</div>';
}

function stat(n, label, pct) {
  const bar = pct == null ? "" : '<div class="bar"><i style="width:'+pct+'%"></i></div>';
  return '<div class="stat"><div class="n">'+n+'</div><div class="l">'+label+'</div>'+bar+'</div>';
}

async function loadCards() {
  CATALOG = await api("/api/cards");
  renderSets();
}

function renderSets() {
  const onlyMissing = $("#onlyMissing").checked;
  const wrap = $("#sets");
  if (!CATALOG.sets.length) {
    wrap.innerHTML = '<div class="empty">No card data yet.<br>Add teams to <code>data/countries.json</code> and redeploy.<br><br>The <strong>FWC</strong> and <strong>CC</strong> special sets appear once data loads.</div>';
    return;
  }
  // Sets arrive pre-sorted by group then name. Insert a divider whenever the
  // group changes so the grouping is visible.
  const render = setBlock(onlyMissing);
  let html = "";
  let lastGroup = "__none__";
  for (const set of CATALOG.sets) {
    const g = set.kind === "country" ? (set.group || null) : "__special__";
    if (g !== lastGroup) {
      lastGroup = g;
      const label = g === "__special__" ? "Special sets" : g ? "Group " + esc(g) : "Ungrouped";
      html += '<h2 class="section">' + label + '</h2>';
    }
    html += render(set);
  }
  wrap.innerHTML = html;
}

const setBlock = (onlyMissing) => (set) => {
  const have = set.cards.filter((c) => c.count > 0).length;
  const done = have === set.total;
  const cells = set.cards
    .filter((c) => !onlyMissing || c.count === 0)
    .map((c) => cell(c))
    .join("");
  const grid = cells || '<div class="empty" style="grid-column:1/-1">All collected 🎉</div>';
  return (
    '<div class="set">' +
      '<div class="set-head" data-toggle>' +
        '<span class="emoji">'+(set.emoji||"🃏")+'</span>' +
        '<span class="name">'+esc(set.name)+'</span>' +
        (set.group ? '<span class="pill grp">Grp '+esc(set.group)+'</span>' : '') +
        '<span class="pill">'+set.code+'</span>' +
        '<span class="'+(done?"done":"count")+'">'+have+' / '+set.total+(done?" ✓":"")+'</span>' +
      '</div>' +
      '<div class="grid">'+grid+'</div>' +
    '</div>'
  );
};

function cell(c) {
  const have = c.count > 0;
  const dupe = c.count > 1;
  return '<div class="cell '+(have?"have ":"")+(dupe?"dupe":"")+'" data-id="'+c.id+'" data-c="x'+c.count+'" title="'+esc(c.name)+'">' +
    '<span class="num">'+c.number+'</span><span class="code">'+c.set+'</span></div>';
}

const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[m]));

async function checkin(code, delta) {
  const res = await api("/api/checkin", {
    method: "POST", headers: {"content-type":"application/json"},
    body: JSON.stringify({ code, delta }),
  });
  if (res.error) { flash(res.error, "err"); return; }
  if (delta === -1) flash(res.card_id + " removed (x"+res.count+")", "ok");
  else if (res.isNew) flash("✓ New! " + res.card_id + " collected", "ok");
  else flash(res.card_id + " — duplicate (x"+res.count+")", "dupe");
  await Promise.all([loadStats(), loadCards()]);
}

$("#checkin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#code");
  const code = input.value.trim();
  if (!code) return;
  await checkin(code, 1);
  input.value = ""; input.focus();
});

$("#sets").addEventListener("click", (e) => {
  const head = e.target.closest("[data-toggle]");
  if (head) { head.nextElementSibling.classList.toggle("hidden"); return; }
  const c = e.target.closest(".cell");
  if (c) checkin(c.dataset.id, 1);
});

// Right-click / long-press a cell to decrement.
$("#sets").addEventListener("contextmenu", (e) => {
  const c = e.target.closest(".cell");
  if (c) { e.preventDefault(); checkin(c.dataset.id, -1); }
});

$("#onlyMissing").addEventListener("change", renderSets);

$("#reset").addEventListener("click", async () => {
  if (!confirm("Reset the entire collection? This cannot be undone.")) return;
  await api("/api/reset", { method: "POST" });
  flash("Collection reset", "ok");
  await Promise.all([loadStats(), loadCards()]);
});

loadStats();
loadCards();
</script>
</body>
</html>`;
}
