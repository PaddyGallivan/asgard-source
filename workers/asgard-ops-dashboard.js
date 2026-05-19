// asgard-ops-dashboard v1.0.0
//
// Single-page status dashboard for Asgard hardening. Polls the three monitor
// workers + /brief, refreshes every 30s, shows red/amber/green at a glance.
//
// Routes:
//   GET /                  — HTML page (asks for PIN via query param if missing)
//   GET /api/vault-health  — proxies asgard-vault-healthcheck /report
//   GET /api/pin-drift     — proxies asgard-pin-drift-sweeper /report
//   GET /api/regression    — proxies falkor-deploy-regression-test /report
//   GET /api/brief         — proxies asgard-tools /brief
//   POST /api/run/:worker  — trigger a fresh run for any of the three monitors
//
// Bindings needed:
//   AGENT_PIN  (secret_text) — auth + sub-call auth on all proxied endpoints
//
// Optional binding:
//   VAULT_PIN  (secret_text) — required by /brief (if asgard-tools /brief uses VAULT_PIN)
//
// Deploy as worker name: asgard-ops-dashboard
// Recommend route: ops.luckdragon.io (or run on workers.dev for now)

const VERSION = '1.0.0';
const CORS = { 'Access-Control-Allow-Origin': '*' };

function html(body) {
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

const ENDPOINTS = {
  'vault-health':  'https://asgard-vault-healthcheck.pgallivan.workers.dev/report',
  'pin-drift':     'https://asgard-pin-drift-sweeper.pgallivan.workers.dev/report',
  'regression':    'https://falkor-deploy-regression-test.pgallivan.workers.dev/report',
};
const RUN_ENDPOINTS = {
  'vault-health':  'https://asgard-vault-healthcheck.pgallivan.workers.dev/run',
  'pin-drift':     'https://asgard-pin-drift-sweeper.pgallivan.workers.dev/run',
  'regression':    'https://falkor-deploy-regression-test.pgallivan.workers.dev/run',
};

async function proxyReport(url, pin) {
  const r = await fetch(url, { headers: { 'X-Pin': pin }, cf: { cacheTtl: 0 } });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

async function proxyBrief(pin) {
  const r = await fetch(`https://asgard-tools.luckdragon.io/brief?pin=${pin}`);
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Asgard Ops</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { --bg:#0b0d10; --panel:#1a1d22; --panel2:#252a31; --txt:#e6e9ef; --dim:#8b94a3; --good:#34d399; --bad:#f87171; --warn:#fbbf24; --info:#60a5fa; --link:#7dd3fc; --mono:'SFMono-Regular',Menlo,Consolas,monospace; }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px; background:var(--bg); color:var(--txt); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; line-height:1.5; }
  h1 { margin:0 0 4px 0; font-size:24px; }
  .sub { color:var(--dim); font-size:13px; margin-bottom:24px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px; }
  .card { background:var(--panel); border-radius:8px; padding:16px; border:1px solid var(--panel2); }
  .card h2 { margin:0 0 8px 0; font-size:14px; text-transform:uppercase; letter-spacing:0.05em; color:var(--dim); display:flex; justify-content:space-between; align-items:center; }
  .card h2 .badge { font-size:11px; padding:2px 8px; border-radius:99px; font-weight:600; text-transform:none; letter-spacing:0; }
  .badge.good { background:rgba(52,211,153,0.15); color:var(--good); }
  .badge.bad  { background:rgba(248,113,113,0.15); color:var(--bad); }
  .badge.warn { background:rgba(251,191,36,0.15); color:var(--warn); }
  .badge.info { background:rgba(96,165,250,0.15); color:var(--info); }
  .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--panel2); font-size:13px; }
  .row:last-child { border-bottom:0; }
  .row .k { color:var(--dim); }
  .row .v { font-family:var(--mono); }
  .row .v.good { color:var(--good); }
  .row .v.bad  { color:var(--bad); }
  pre { font-family:var(--mono); font-size:12px; background:var(--panel2); padding:12px; border-radius:6px; overflow-x:auto; white-space:pre-wrap; word-break:break-word; max-height:300px; overflow-y:auto; margin:8px 0 0 0; }
  .controls { margin: 16px 0; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  button { background:var(--panel2); color:var(--txt); border:1px solid var(--panel2); padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; font-family:inherit; }
  button:hover { background:#3a4049; }
  button.primary { background:#0ea5e9; border-color:#0ea5e9; }
  button.primary:hover { background:#0284c7; }
  .footer { color:var(--dim); font-size:12px; margin-top:32px; text-align:center; }
  .footer a { color:var(--link); }
  .login { max-width:400px; margin:80px auto; background:var(--panel); padding:32px; border-radius:8px; border:1px solid var(--panel2); }
  .login input { width:100%; padding:10px; background:var(--panel2); border:1px solid var(--panel2); border-radius:6px; color:var(--txt); font-family:var(--mono); font-size:14px; margin:8px 0 16px 0; }
  .err { color:var(--bad); font-size:13px; margin-top:8px; }
  .countdown { display:inline-block; min-width:30px; text-align:right; }
</style>
</head>
<body>
<div id="root"></div>
<script>
  const params = new URLSearchParams(location.search);
  const pin = params.get('pin') || sessionStorage.getItem('ops_pin');
  const root = document.getElementById('root');
  if (!pin) {
    root.innerHTML = \`
      <div class="login">
        <h1>Asgard Ops</h1>
        <div class="sub">Enter PIN</div>
        <input id="pin" type="password" autofocus placeholder="AGENT_PIN">
        <button class="primary" onclick="(()=>{ const p=document.getElementById('pin').value; if(p){sessionStorage.setItem('ops_pin',p);location.search='?pin='+encodeURIComponent(p);}})()">Continue</button>
      </div>\`;
  } else {
    sessionStorage.setItem('ops_pin', pin);
    boot(pin);
  }
  async function fetchJson(url) {
    try { const r = await fetch(url); return { status: r.status, body: await r.json().catch(() => ({})) }; }
    catch (e) { return { status: 0, error: e.message }; }
  }
  function fmt(o) { return JSON.stringify(o, null, 2); }
  function badge(text, kind) { return \`<span class="badge \${kind}">\${text}</span>\`; }
  function vaultCard(r) {
    if (!r) return '<div class="card"><h2>Vault Healthcheck '+badge('loading','info')+'</h2></div>';
    if (r.status !== 200) return '<div class="card"><h2>Vault Healthcheck '+badge('error '+r.status,'bad')+'</h2><pre>'+fmt(r.body||r.error)+'</pre></div>';
    const b = r.body;
    const k = b.failed > 0 ? 'bad' : b.passed > 0 ? 'good' : 'warn';
    const failedKeys = (b.results || []).filter(x => x.present && x.ok === false);
    return \`<div class="card">
      <h2>Vault Healthcheck \${badge((b.failed||0)+' failed / '+(b.passed||0)+' passed', k)}</h2>
      <div class="row"><span class="k">Last run</span><span class="v">\${b.startedAt || '—'}</span></div>
      <div class="row"><span class="k">Total keys</span><span class="v">\${b.total||0}</span></div>
      <div class="row"><span class="k">Present</span><span class="v">\${b.present||0}</span></div>
      <div class="row"><span class="k">Delta</span><span class="v">+\${(b.deltaSinceLastRun?.newlyFailed||[]).length} new, +\${(b.deltaSinceLastRun?.recovered||[]).length} recovered</span></div>
      \${failedKeys.length ? '<pre>'+failedKeys.map(f=>f.key+' ('+f.provider+'): '+(f.error||'HTTP '+f.status)).join('\\n')+'</pre>' : ''}
    </div>\`;
  }
  function pinDriftCard(r) {
    if (!r) return '<div class="card"><h2>PIN Drift Sweeper '+badge('loading','info')+'</h2></div>';
    if (r.status !== 200) return '<div class="card"><h2>PIN Drift Sweeper '+badge('error '+r.status,'bad')+'</h2><pre>'+fmt(r.body||r.error)+'</pre></div>';
    const b = r.body;
    const k = (b.plainTextPins||[]).length > 0 ? 'bad' : 'good';
    return \`<div class="card">
      <h2>PIN Drift Sweeper \${badge((b.plainTextPins||[]).length+' drifts',k)}</h2>
      <div class="row"><span class="k">Last run</span><span class="v">\${b.startedAt || '—'}</span></div>
      <div class="row"><span class="k">Workers scanned</span><span class="v">\${b.workersScanned||0}</span></div>
      \${b.distribution ? Object.entries(b.distribution).map(([p,d])=>'<div class="row"><span class="k">'+p+'</span><span class="v">'+d.secret+' secret / '+d.plain+' plain / '+d.absent+' absent</span></div>').join('') : ''}
      \${(b.plainTextPins||[]).length ? '<pre>'+b.plainTextPins.map(p=>p.worker+' :: '+p.pin).join('\\n')+'</pre>' : ''}
    </div>\`;
  }
  function regressionCard(r) {
    if (!r) return '<div class="card"><h2>Regression Test '+badge('loading','info')+'</h2></div>';
    if (r.status !== 200) return '<div class="card"><h2>Regression Test '+badge('error '+r.status,'bad')+'</h2></div>';
    const b = r.body;
    if (b.message) return '<div class="card"><h2>Regression Test '+badge('no runs yet','warn')+'</h2><div class="sub">'+b.message+'</div></div>';
    const k = b.ok ? 'good' : 'bad';
    return \`<div class="card">
      <h2>Regression Test \${badge(b.ok ? 'pass' : 'fail',k)}</h2>
      <div class="row"><span class="k">Last run</span><span class="v">\${b.startedAt || '—'}</span></div>
      <div class="row"><span class="k">Target</span><span class="v">\${b.target||'—'}</span></div>
      <div class="row"><span class="k">Bindings (before→after)</span><span class="v">\${b.diff?.before_count||0} → \${b.diff?.after_count||0}</span></div>
      \${b.error ? '<pre>'+b.error+'</pre>' : ''}
    </div>\`;
  }
  function briefCard(r) {
    if (!r) return '<div class="card"><h2>Brief '+badge('loading','info')+'</h2></div>';
    if (r.status !== 200) return '<div class="card"><h2>Brief '+badge('error '+r.status,'bad')+'</h2><pre>'+fmt(r.body||r.error)+'</pre></div>';
    const b = r.body;
    const raw = b.raw || {};
    return \`<div class="card">
      <h2>Falkor Brief</h2>
      <div class="row"><span class="k">Agent</span><span class="v \${raw.agent?.ok ? 'good':'bad'}">\${raw.agent?.status || raw.agent?.error || '?'}</span></div>
      <div class="row"><span class="k">Workflows</span><span class="v \${raw.workflows?.ok ? 'good':'bad'}">\${raw.workflows?.status || raw.workflows?.error || '?'}</span></div>
      <div class="row"><span class="k">Brain</span><span class="v \${raw.brain?.ok ? 'good':'bad'}">\${raw.brain?.status || raw.brain?.error || '?'}</span></div>
      \${b.brief ? '<pre>'+b.brief+'</pre>' : ''}
    </div>\`;
  }
  function render(vh, pd, rg, br, nextIn) {
    root.innerHTML = \`
      <h1>Asgard Ops</h1>
      <div class="sub">v\${'${VERSION}'} · refreshes every 30s · next in <span class="countdown">\${nextIn}</span>s</div>
      <div class="controls">
        <button onclick="refresh()">Refresh now</button>
        <button onclick="triggerRun('vault-health')">Run vault check</button>
        <button onclick="triggerRun('pin-drift')">Run PIN sweep</button>
        <button onclick="triggerRun('regression')">Run regression</button>
        <button onclick="sessionStorage.removeItem('ops_pin');location.href='/'">Sign out</button>
      </div>
      <div class="grid">
        \${briefCard(br)}
        \${vaultCard(vh)}
        \${pinDriftCard(pd)}
        \${regressionCard(rg)}
      </div>
      <div class="footer">asgard-ops-dashboard · last fetched \${new Date().toLocaleTimeString()}</div>\`;
  }
  let state = { vh: null, pd: null, rg: null, br: null, nextIn: 30 };
  async function refresh() {
    state.nextIn = 30;
    const [vh, pd, rg, br] = await Promise.all([
      fetchJson('/api/vault-health'),
      fetchJson('/api/pin-drift'),
      fetchJson('/api/regression'),
      fetchJson('/api/brief'),
    ]);
    state = { vh, pd, rg, br, nextIn: 30 };
    render(vh, pd, rg, br, 30);
  }
  async function triggerRun(name) {
    const btns = document.querySelectorAll('button');
    btns.forEach(b => b.disabled = true);
    try {
      await fetch('/api/run/'+name, { method: 'POST' });
      await refresh();
    } finally { btns.forEach(b => b.disabled = false); }
  }
  function boot() {
    refresh();
    setInterval(() => {
      state.nextIn--;
      if (state.nextIn <= 0) { refresh(); return; }
      const el = document.querySelector('.countdown');
      if (el) el.textContent = state.nextIn;
    }, 1000);
  }
  window.refresh = refresh;
  window.triggerRun = triggerRun;
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const pin = url.searchParams.get('pin') || request.headers.get('X-Pin');

    if (path === '/health') return json({ ok: true, worker: 'asgard-ops-dashboard', version: VERSION });

    // Serve HTML for root
    if (path === '/' || path === '') return html(PAGE);

    // All /api/* needs AGENT_PIN match (server-side auth, no leaking)
    if (path.startsWith('/api/')) {
      if (!env.AGENT_PIN) return json({ error: 'AGENT_PIN binding missing on this worker' }, 500);
      if (pin !== env.AGENT_PIN) return json({ error: 'Unauthorized' }, 401);

      if (path === '/api/brief') return proxyBrief(env.VAULT_PIN || env.AGENT_PIN);

      // Match /api/<name>
      const m = path.match(/^\/api\/([a-z0-9-]+)$/);
      if (m && ENDPOINTS[m[1]]) return proxyReport(ENDPOINTS[m[1]], env.AGENT_PIN);

      // POST /api/run/<name>
      const r = path.match(/^\/api\/run\/([a-z0-9-]+)$/);
      if (r && RUN_ENDPOINTS[r[1]] && request.method === 'POST') {
        const resp = await fetch(RUN_ENDPOINTS[r[1]], { method: 'POST', headers: { 'X-Pin': env.AGENT_PIN } });
        return new Response(await resp.text(), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
      }

      return json({ error: 'Not found' }, 404);
    }

    return new Response('Not found', { status: 404 });
  },
};