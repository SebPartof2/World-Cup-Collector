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
  .pageedit { font-size: 13px; color: var(--muted); display: inline-flex; align-items: center; gap: 3px; }
  .pageinput { width: 46px; padding: 3px 6px; font-size: 13px; text-align: center;
    border: 1px solid var(--line); background: var(--panel2); color: var(--text); border-radius: 7px; }
  .pageinput:focus { outline: 1px solid var(--accent2); }
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

  .dupe-wrap { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
  .dupe-wrap .hd { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 6px; }
  .dupe-wrap .hd .t { font-weight: 700; }
  .dupe-wrap .hd .s { color: var(--muted); font-size: 12px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px;
    background: #2a2410; border: 1px solid #5a4a12; color: var(--gold); cursor: pointer; font-size: 14px; }
  .chip:hover { background: #3a3214; }
  .chip .x { background: var(--gold); color: #3a2c00; font-weight: 700; border-radius: 999px;
    padding: 0 7px; font-size: 12px; }
  .chip .fl { font-size: 15px; }
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
  <div class="sub"><a href="/mass">⚡ Mass check-in mode →</a></div>
</header>
<main>
  <form class="checkin" id="checkin">
    <input id="code" name="code" placeholder="Enter sticker code…" autocomplete="off" autofocus />
    <button type="submit">Check in</button>
  </form>
  <div class="toast" id="toast"></div>

  <div class="stats" id="stats"></div>

  <div id="groups"></div>

  <div id="dupes"></div>

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
  let data = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) {
    const msg = (data && data.error) || (r.status + " " + r.statusText);
    flash(msg, "err");
    throw new Error(msg);
  }
  return data;
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
  if (s.badges && s.badges.total)
    cards.push(stat(s.badges.collected + " / " + s.badges.total, "Team badges", s.badges.percent));
  if (s.pictures && s.pictures.total)
    cards.push(stat(s.pictures.collected + " / " + s.pictures.total, "Team pictures", s.pictures.percent));
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
  renderDupes();
}

// The swaps list: every card owned more than once, derived from the catalog
// we already loaded so it stays in sync with the grid.
function renderDupes() {
  const wrap = $("#dupes");
  const dupes = [];
  for (const set of CATALOG.sets || []) {
    for (const c of set.cards) {
      if (c.count > 1) dupes.push({ ...c, emoji: set.emoji });
    }
  }
  if (!dupes.length) { wrap.innerHTML = ""; return; }
  const totalSpares = dupes.reduce((n, d) => n + (d.count - 1), 0);
  const chips = dupes.map((d) =>
    '<span class="chip" data-id="'+d.id+'" title="Click to remove a spare ('+esc(d.name)+')">' +
      '<span class="fl">'+(d.emoji||"🃏")+'</span>'+d.id+'<span class="x">×'+(d.count-1)+'</span></span>'
  ).join("");
  wrap.innerHTML =
    '<div class="dupe-wrap"><div class="hd">' +
      '<span class="t">🔁 Duplicates / swaps</span>' +
      '<span class="s">'+totalSpares+' spare'+(totalSpares===1?"":"s")+' across '+dupes.length+' card'+(dupes.length===1?"":"s")+' · click a chip to remove one</span>' +
    '</div><div class="chips">'+chips+'</div></div>';
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
        (set.group ? '<span class="pill grp">Grp '+esc(set.group)+(set.draw!=null?"."+set.draw:"")+'</span>' : '') +
        '<span class="pill">'+set.code+'</span>' +
        '<span class="pageedit" onclick="event.stopPropagation()" title="Album page for this set (shown in mass mode)">📄 ' +
          '<input class="pageinput" data-code="'+set.code+'" value="'+esc(set.page||"")+'" placeholder="pg" /></span>' +
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
  if (e.target.closest(".pageedit")) return; // editing a page number, not toggling
  const head = e.target.closest("[data-toggle]");
  if (head) { head.nextElementSibling.classList.toggle("hidden"); return; }
  const c = e.target.closest(".cell");
  if (c) checkin(c.dataset.id, 1);
});

// Save album page numbers as they're edited.
$("#sets").addEventListener("change", (e) => {
  const inp = e.target.closest(".pageinput");
  if (inp) savePage(inp.dataset.code, inp.value);
});
$("#sets").addEventListener("keydown", (e) => {
  const inp = e.target.closest(".pageinput");
  if (inp && e.key === "Enter") { e.preventDefault(); inp.blur(); }
});

async function savePage(code, page) {
  const res = await api("/api/page", {
    method: "POST", headers: {"content-type":"application/json"},
    body: JSON.stringify({ code, page }),
  });
  if (res.error) { flash(res.error, "err"); return; }
  flash(code + (res.page ? " → page " + res.page : " page cleared"), "ok");
  // Refresh catalog so the mass-mode snapshot and chips pick up the new page.
  CATALOG = await api("/api/cards");
}

// Right-click / long-press a cell to decrement.
$("#sets").addEventListener("contextmenu", (e) => {
  const c = e.target.closest(".cell");
  if (c) { e.preventDefault(); checkin(c.dataset.id, -1); }
});

// Click a duplicate chip to remove one spare (e.g. after a swap).
$("#dupes").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) checkin(chip.dataset.id, -1);
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

// Full-screen "mass check-in" screen: type a code big, get a full-screen
// colour-coded response (new / duplicate / invalid). Built for rapid entry.
export function renderMassPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mass Check-in · World Cup Collector</title>
<style>
  :root {
    --bg:#0b1020; --panel2:#1b2540; --line:#263255; --text:#e8ecf6; --muted:#97a3c2;
    --new:#16a34a; --new2:#22c55e; --dupe:#d97706; --dupe2:#f59e0b; --bad:#dc2626; --bad2:#ef4444;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { font: 16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    background: var(--bg); color: var(--text); overflow: hidden; }
  .top { position: fixed; top: 0; left: 0; right: 0; display: flex; justify-content: space-between;
    align-items: center; padding: 12px 18px; z-index: 5; }
  .top a { color: var(--muted); text-decoration: none; font-size: 14px; }
  .top a:hover { color: var(--text); }
  .tally { display: flex; gap: 14px; font-size: 13px; }
  .tally b { font-size: 16px; }
  .t-new b { color: var(--new2); } .t-dupe b { color: var(--dupe2); } .t-bad b { color: var(--bad2); }

  .stage { height: 100%; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 20px; }
  .prompt { text-align: center; width: 100%; max-width: 760px; }
  .prompt .hint { color: var(--muted); margin-bottom: 18px; font-size: 15px; }
  #code { width: 100%; text-align: center; text-transform: uppercase; letter-spacing: 6px;
    font-size: clamp(48px, 14vw, 130px); font-weight: 800; padding: 10px 16px;
    border: 0; border-bottom: 4px solid var(--line); background: transparent; color: var(--text); }
  #code:focus { outline: none; border-bottom-color: var(--new2); }
  #code::placeholder { color: #33406b; }

  /* Full-screen colour response */
  .result { position: fixed; inset: 0; z-index: 10; display: none; flex-direction: column;
    align-items: center; justify-content: center; padding: 24px; text-align: center;
    animation: pop .18s ease-out; }
  .result.show { display: flex; }
  .result.new { background: linear-gradient(160deg, var(--new), var(--new2)); }
  .result.dupe { background: linear-gradient(160deg, var(--dupe), var(--dupe2)); }
  .result.bad { background: linear-gradient(160deg, var(--bad), var(--bad2)); }
  @keyframes pop { from { transform: scale(.97); opacity: .4; } to { transform: scale(1); opacity: 1; } }
  .verdict { font-size: clamp(40px, 11vw, 110px); font-weight: 900; letter-spacing: 2px;
    text-transform: uppercase; line-height: 1; }
  .bigcode { font-size: clamp(28px, 7vw, 64px); font-weight: 800; margin-top: 8px; letter-spacing: 4px; }
  .pagebig { display: inline-block; margin-top: 14px; padding: 8px 22px; border-radius: 14px;
    background: rgba(0,0,0,.28); font-size: clamp(26px, 6vw, 52px); font-weight: 900; letter-spacing: 1px; }
  .detail { font-size: clamp(18px, 3.4vw, 28px); margin-top: 10px; opacity: .95; }
  .meta { font-size: clamp(16px, 3vw, 24px); margin-top: 8px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; opacity: .9; }
  .countbig { font-size: clamp(70px, 20vw, 180px); font-weight: 900; line-height: 1; margin: 6px 0; }
  .emoji { font-size: clamp(40px, 9vw, 80px); }
  .closehint { position: fixed; bottom: 18px; font-size: 14px; opacity: .85; }

  /* Country matrix shown on a NEW card */
  .matrix { display: grid; gap: 7px; margin-top: 18px;
    grid-template-columns: repeat(10, minmax(0,1fr)); width: min(92vw, 560px); }
  .mcell { aspect-ratio: 1; border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: clamp(11px, 2.4vw, 16px); background: rgba(0,0,0,.18); color: rgba(255,255,255,.55);
    border: 1px solid rgba(255,255,255,.18); }
  .mcell.have { background: rgba(255,255,255,.92); color: #064e2b; }
  .mcell.now { outline: 4px solid #fff; transform: scale(1.12); box-shadow: 0 0 0 4px rgba(0,0,0,.25);
    animation: glow 1s ease-in-out infinite alternate; }
  @keyframes glow { from { box-shadow: 0 0 6px 2px rgba(255,255,255,.5);} to { box-shadow: 0 0 22px 8px rgba(255,255,255,.95);} }
</style>
</head>
<body>
<div class="top">
  <a href="/">← Collector</a>
  <div class="tally">
    <span class="t-new">New <b id="cNew">0</b></span>
    <span class="t-dupe">Dupes <b id="cDupe">0</b></span>
    <span class="t-bad">Invalid <b id="cBad">0</b></span>
  </div>
</div>

<div class="stage">
  <form class="prompt" id="form">
    <div class="hint">Scan-style mass check-in — type a code and hit <strong>Enter</strong></div>
    <input id="code" placeholder="USA1" autocomplete="off" autocapitalize="characters"
      autocorrect="off" spellcheck="false" inputmode="text" autofocus />
  </form>
</div>

<div class="result" id="result">
  <div id="rbody"></div>
  <div class="closehint">Press any key or tap to continue</div>
</div>

<script>
const $ = (s) => document.querySelector(s);
const input = $("#code");
const result = $("#result");
const counts = { new: 0, dupe: 0, bad: 0 };
let open = false;

const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[m]));

function matrix(set, nowId) {
  const cells = set.cards.map((c) =>
    '<div class="mcell '+(c.count>0?"have ":"")+(c.id===nowId?"now":"")+'">'+c.number+'</div>'
  ).join("");
  return '<div class="emoji">'+(set.emoji||"🃏")+'</div>' +
    '<div class="detail" style="margin-top:4px"><strong>'+esc(set.name)+'</strong> · '+
      set.collected+' / '+set.total+' collected</div>' +
    '<div class="matrix" style="grid-template-columns:repeat('+Math.min(10,set.total)+',minmax(0,1fr))">'+cells+'</div>';
}

function pageBanner(set) {
  return set && set.page ? '<div class="pagebig">📄 Page '+esc(set.page)+'</div>' : '';
}

function metaLine(set) {
  if (!set) return '';
  const bits = [];
  if (set.group) bits.push('Group ' + esc(set.group));
  if (set.draw != null) bits.push('Seed ' + esc(set.draw));
  return bits.length ? '<div class="meta">'+bits.join(' · ')+'</div>' : '';
}

function show(kind, html) {
  result.className = "result show " + kind;
  $("#rbody").innerHTML = html;
  open = true;
  counts[kind === "new" ? "new" : kind === "dupe" ? "dupe" : "bad"]++;
  $("#cNew").textContent = counts.new;
  $("#cDupe").textContent = counts.dupe;
  $("#cBad").textContent = counts.bad;
}

function dismiss(seed) {
  if (!open) return;
  open = false;
  result.className = "result";
  input.value = seed && seed.length === 1 ? seed : "";
  input.focus();
}

async function checkin(code) {
  let res;
  try {
    res = await (await fetch("/api/checkin", {
      method: "POST", headers: {"content-type":"application/json"},
      body: JSON.stringify({ code }),
    })).json();
  } catch (e) { res = { error: "Network error" }; }

  if (res.error) {
    show("bad",
      '<div class="verdict">Invalid</div>' +
      '<div class="bigcode">'+esc(code.toUpperCase())+'</div>' +
      '<div class="detail">Not a real sticker code</div>');
    return;
  }
  if (res.isNew && res.set) {
    show("new",
      '<div class="verdict">New!</div>' +
      '<div class="bigcode">'+esc(res.card_id)+'</div>' +
      metaLine(res.set) +
      pageBanner(res.set) +
      matrix(res.set, res.card_id));
  } else if (res.isNew) {
    show("new",
      '<div class="verdict">New!</div><div class="bigcode">'+esc(res.card_id)+'</div>' +
      metaLine(res.set) + pageBanner(res.set));
  } else {
    show("dupe",
      '<div class="verdict">Duplicate</div>' +
      '<div class="bigcode">'+esc(res.card_id)+'</div>' +
      metaLine(res.set) +
      pageBanner(res.set) +
      '<div class="countbig">×'+res.count+'</div>' +
      '<div class="detail">You have '+res.count+' of this card ('+(res.count-1)+' spare'+(res.count-1===1?"":"s")+')</div>');
  }
}

$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = input.value.trim();
  if (!code) return;
  input.value = "";
  checkin(code);
});

// While a result is shown, any key / tap returns to the input for the next code.
document.addEventListener("keydown", (e) => {
  if (!open) return;
  e.preventDefault();
  const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey ? e.key : "";
  dismiss(printable);
});
result.addEventListener("click", () => dismiss());

// Keep focus on the input at all times so typing always works.
document.addEventListener("click", () => { if (!open) input.focus(); });
input.focus();
</script>
</body>
</html>`;
}
