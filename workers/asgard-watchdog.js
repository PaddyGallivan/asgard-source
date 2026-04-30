// asgard-watchdog v1.1.0
// Cron: every 5 minutes — workers checked via CF API, sites via HTTP
// State-change alerting via Resend, D1 logging, auto-heal asgard if down

const VERSION = '1.1.0';
const ACCOUNT_ID = 'a6f47c17811ee2f8b6caeb8f38768c20';
const ALERT_FROM = 'Asgard Watchdog <watchdog@luckdragon.io>';
const ALERT_TO = ['paddy@luckdragon.io', 'rooney.jaclyn.l@gmail.com'];

// Workers: checked via CF deployments API (avoids *.luckdragon.io loopback block)
const WORKER_CHECKS = [
  { name: 'asgard',        autofix: true  },
  { name: 'asgard-ai',     autofix: false },
  { name: 'asgard-tools',  autofix: false },
  { name: 'asgard-brain',  autofix: false },
  { name: 'asgard-vault',  autofix: false },
  { name: 'asgard-backup', autofix: false },
];

// Sites: checked via HTTP GET (not subject to the zone loopback restriction)
const SITE_CHECKS = [
  { name: 'longrangetipping', url: 'https://longrangetipping.com/'   },
  { name: 'carnivaltiming',   url: 'https://carnivaltiming.com/'     },
  { name: 'wps-hub',          url: 'https://wps.carnivaltiming.com/' },
];

// ─── Worker health via CF API ──────────────────────────────────────────────────
async function checkWorker(check, cfToken) {
  const start = Date.now();
  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${check.name}/deployments`,
      { headers: { Authorization: `Bearer ${cfToken}` } }
    );
    const latency = Date.now() - start;
    if (!r.ok) return { ok: false, status: r.status, latency, error: `CF API ${r.status}` };
    const j = await r.json();
    const items = j?.result?.deployments || j?.result?.items || [];
    if (items.length === 0) return { ok: false, status: 200, latency, error: 'no deployments found' };
    const latest = items[0];
    const ageDays = (Date.now() - new Date(latest.created_on).getTime()) / 86400000;
    const ok = ageDays < 30;
    return { ok, status: 200, latency, error: ok ? null : `stale: last deploy ${ageDays.toFixed(1)}d ago` };
  } catch (e) {
    return { ok: false, status: 0, latency: Date.now() - start, error: e.message };
  }
}

// ─── Site health via HTTP ──────────────────────────────────────────────────────
async function checkSite(check) {
  const start = Date.now();
  try {
    const r = await Promise.race([
      fetch(check.url, { method: 'GET', cf: { cacheEverything: false } }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
    ]);
    const latency = Date.now() - start;
    const ok = r.status >= 200 && r.status < 400;
    return { ok, status: r.status, latency, error: ok ? null : `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, status: 0, latency: Date.now() - start, error: e.message };
  }
}

// ─── D1 helpers ───────────────────────────────────────────────────────────────
async function getState(db, name) {
  try {
    const row = await db.prepare('SELECT * FROM health_state WHERE endpoint = ?').bind(name).first();
    return row || { endpoint: name, last_ok: 1, last_change: new Date().toISOString(), consecutive_failures: 0 };
  } catch {
    return { endpoint: name, last_ok: 1, last_change: new Date().toISOString(), consecutive_failures: 0 };
  }
}

async function setState(db, name, ok, now) {
  const existing = await getState(db, name);
  const wasOk = existing.last_ok === 1;
  const changed = wasOk !== ok;
  const consecutive_failures = ok ? 0 : ((existing.consecutive_failures || 0) + 1);
  const last_change = changed ? now : (existing.last_change || now);
  try {
    await db.prepare(
      'INSERT INTO health_state (endpoint, last_ok, last_change, consecutive_failures) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET last_ok = excluded.last_ok, last_change = CASE WHEN last_ok != excluded.last_ok THEN excluded.last_change ELSE health_state.last_change END, consecutive_failures = excluded.consecutive_failures'
    ).bind(name, ok ? 1 : 0, last_change, consecutive_failures).run();
  } catch (e) {
    console.error('setState:', e.message);
  }
  return { changed, wasOk, consecutive_failures };
}

async function logCheck(db, name, result, now) {
  try {
    await db.prepare(
      'INSERT INTO health_log (check_time, endpoint, status, ok, latency_ms, error) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(now, name, result.status, result.ok ? 1 : 0, result.latency, result.error || null).run();
  } catch (e) {
    console.error('logCheck:', e.message);
  }
}

// ─── Email alert ──────────────────────────────────────────────────────────────
async function sendAlert(env, subject, html) {
  if (!env.RESEND_API_KEY) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: ALERT_FROM, to: ALERT_TO, subject, html }),
  }).catch(e => console.error('sendAlert:', e.message));
}

// ─── Auto-heal asgard ─────────────────────────────────────────────────────────
async function tryAutofix(env, name) {
  if (name !== 'asgard' || !env.X_PIN) return { attempted: false };
  try {
    const srcR = await fetch('https://raw.githubusercontent.com/PaddyGallivan/asgard-source/main/workers/asgard.js');
    if (!srcR.ok) return { attempted: true, success: false, error: `GitHub ${srcR.status}` };
    const src = await srcR.text();
    const bytes = new TextEncoder().encode(src);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    const code_b64 = btoa(bin);
    const dr = await fetch('https://asgard-tools.luckdragon.io/admin/deploy', {
      method: 'POST',
      headers: { 'X-Pin': env.X_PIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_name: 'asgard', code_b64, main_module: 'worker.js' }),
    });
    const body = await dr.text();
    return { attempted: true, success: dr.ok, detail: body.slice(0, 200) };
  } catch (e) {
    return { attempted: true, success: false, error: e.message };
  }
}

// ─── Asgard inbox post ────────────────────────────────────────────────────────
async function postToInbox(db, message) {
  try {
    await db.prepare(
      "INSERT INTO messages (created_at, group_id, role, content, read_by_user) VALUES (?, 'watchdog', 'assistant', ?, 0)"
    ).bind(new Date().toISOString(), message).run();
  } catch { /* table schema may vary */ }
}

// ─── Email template ───────────────────────────────────────────────────────────
function buildAlertEmail(alerts, now) {
  const rows = alerts.map(a => {
    const bg = a.type === 'down' ? '#fee2e2' : '#dcfce7';
    const icon = a.type === 'down' ? '🔴' : '🟢';
    const status = a.type === 'down' ? 'DOWN' : 'RECOVERED';
    const detail = a.type === 'down' ? (a.error || 'unknown') : `${a.latency}ms`;
    const action = a.fixResult?.attempted ? (a.fixResult.success ? '✅ Auto-healed' : '❌ Heal failed') : '—';
    return `<tr style="background:${bg}"><td style="padding:10px 14px;font-weight:600">${icon} ${a.name}</td><td style="padding:10px 14px">${status}</td><td style="padding:10px 14px;font-family:monospace;font-size:12px">${detail}</td><td style="padding:10px 14px">${action}</td></tr>`;
  }).join('');
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:32px"><div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)"><div style="background:#1a1a2e;padding:24px 28px"><h2 style="color:#6366f1;margin:0">⚡ Asgard Watchdog</h2><p style="color:#a0a0cc;margin:6px 0 0;font-size:14px">${now}</p></div><div style="padding:24px 28px"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f1f5f9"><th style="padding:10px 14px;text-align:left;font-size:13px">Service</th><th style="padding:10px 14px;text-align:left;font-size:13px">Status</th><th style="padding:10px 14px;text-align:left;font-size:13px">Detail</th><th style="padding:10px 14px;text-align:left;font-size:13px">Action</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:24px;font-size:13px;color:#666">Live: <a href="https://asgard-watchdog.luckdragon.io/" style="color:#6366f1">asgard-watchdog.luckdragon.io</a></p></div></div></body></html>`;
}

// ─── Status page HTML ─────────────────────────────────────────────────────────
function buildStatusPage(states) {
  const rows = (states || []).map(s => {
    const ok = s.last_ok === 1;
    const badge = ok ? '<span style="color:#16a34a;font-weight:bold">● UP</span>' : '<span style="color:#dc2626;font-weight:bold">● DOWN</span>';
    const since = (s.last_change || '').replace('T', ' ').slice(0, 19) + ' UTC';
    return `<tr><td style="padding:10px 16px">${s.endpoint}</td><td style="padding:10px 16px">${badge}</td><td style="padding:10px 16px;color:${(s.consecutive_failures||0)>0?'#dc2626':'#666'}">${s.consecutive_failures||0}</td><td style="padding:10px 16px;color:#666;font-size:13px">${since}</td></tr>`;
  }).join('') || '<tr><td colspan="4" style="padding:16px;color:#666;text-align:center">No data — hit /run to trigger first check</td></tr>';
  return `<!DOCTYPE html><html><head><title>Asgard Watchdog</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;background:#0a0a1a;color:#e0e0f0;padding:0;margin:0}.wrap{max-width:860px;margin:40px auto;padding:0 20px}h1{color:#6366f1;font-size:24px;margin-bottom:4px}.sub{color:#a0a0cc;font-size:14px;margin-bottom:28px}table{width:100%;border-collapse:collapse;background:#111128;border-radius:10px;overflow:hidden}th{background:#1e1e3a;padding:10px 16px;text-align:left;font-size:13px;color:#a0a0cc;font-weight:600}tr:not(:last-child) td{border-bottom:1px solid #2a2a5a}.actions{margin-top:20px;display:flex;gap:12px;font-size:13px}.actions a{color:#6366f1;text-decoration:none;padding:6px 14px;border:1px solid #6366f1;border-radius:6px}.ver{margin-top:32px;color:#444;font-size:12px}</style></head><body><div class="wrap"><h1>⚡ Asgard Watchdog</h1><p class="sub">Checks every 5 min — emails only on state changes</p><table><thead><tr><th>Service</th><th>Status</th><th>Failures</th><th>Last change</th></tr></thead><tbody>${rows}</tbody></table><div class="actions"><a href="/run">▶ Run now</a><a href="/status">{ } JSON</a><a href="https://asgard.luckdragon.io">🏰 Asgard</a></div><p class="ver">v${VERSION} · asgard-watchdog.luckdragon.io</p></div></body></html>`;
}

// ─── D1 migration ─────────────────────────────────────────────────────────────
async function runMigration(db) {
  const stmts = [
    'CREATE TABLE IF NOT EXISTS health_log (id INTEGER PRIMARY KEY AUTOINCREMENT, check_time TEXT NOT NULL, endpoint TEXT NOT NULL, status INTEGER, ok INTEGER NOT NULL, latency_ms INTEGER, error TEXT)',
    'CREATE TABLE IF NOT EXISTS health_state (endpoint TEXT PRIMARY KEY, last_ok INTEGER NOT NULL DEFAULT 1, last_change TEXT NOT NULL, consecutive_failures INTEGER NOT NULL DEFAULT 0)',
    'CREATE INDEX IF NOT EXISTS idx_health_log_endpoint ON health_log(endpoint)',
    'CREATE INDEX IF NOT EXISTS idx_health_log_time ON health_log(check_time)',
  ];
  const results = [];
  for (const sql of stmts) {
    try { await db.prepare(sql).run(); results.push({ ok: true, sql: sql.slice(0, 55) }); }
    catch (e) { results.push({ ok: false, sql: sql.slice(0, 55), error: e.message }); }
  }
  return results;
}

// ─── Main check loop ──────────────────────────────────────────────────────────
async function runChecks(env) {
  const now = new Date().toISOString();
  const db = env.DB;
  if (!db) { console.error('No DB binding'); return; }
  const cfToken = env.CF_API_TOKEN;
  if (!cfToken) { console.error('No CF_API_TOKEN'); return; }

  // Run all checks in parallel
  const workerResults = await Promise.all(WORKER_CHECKS.map(c => checkWorker(c, cfToken)));
  const siteResults   = await Promise.all(SITE_CHECKS.map(c => checkSite(c)));

  const allChecks   = [...WORKER_CHECKS.map((c, i) => ({ ...c, ...workerResults[i] })),
                       ...SITE_CHECKS.map((c, i)   => ({ ...c, ...siteResults[i] }))];
  const alerts = [];

  for (const check of allChecks) {
    await logCheck(db, check.name, check, now);
    const stateChange = await setState(db, check.name, check.ok, now);
    if (!stateChange.changed) continue;
    if (!check.ok) {
      const fixResult = check.autofix ? await tryAutofix(env, check.name) : { attempted: false };
      alerts.push({ type: 'down', name: check.name, error: check.error, latency: check.latency, fixResult });
    } else {
      alerts.push({ type: 'up', name: check.name, latency: check.latency });
    }
  }

  if (alerts.length === 0) return;

  const downs = alerts.filter(a => a.type === 'down');
  const subject = downs.length > 0
    ? `🚨 [Asgard] ${downs.map(a => a.name).join(', ')} DOWN`
    : `✅ [Asgard] ${alerts.map(a => a.name).join(', ')} recovered`;

  await sendAlert(env, subject, buildAlertEmail(alerts, now));

  const lines = alerts.map(a => a.type === 'down'
    ? `🔴 **${a.name}** DOWN (${a.error})${a.fixResult?.attempted ? (a.fixResult.success ? ' — 🔧 auto-healed' : ' — ❌ heal failed') : ''}`
    : `🟢 **${a.name}** back UP (${a.latency}ms)`);
  await postToInbox(db, `**Watchdog** ${now}\n\n${lines.join('\n')}`);
}

// ─── Worker export ────────────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (url.pathname === '/run') {
      ctx.waitUntil(runChecks(env));
      return new Response(JSON.stringify({ ok: true, message: 'Check triggered', ts: new Date().toISOString() }), { headers: cors });
    }
    if (url.pathname === '/migrate') {
      if (!env.DB) return new Response(JSON.stringify({ error: 'No DB binding' }), { status: 500, headers: cors });
      return new Response(JSON.stringify({ ok: true, results: await runMigration(env.DB) }), { headers: cors });
    }
    if (url.pathname === '/status') {
      if (!env.DB) return new Response(JSON.stringify({ error: 'No DB binding' }), { status: 500, headers: cors });
      try {
        const [states, recent] = await Promise.all([
          env.DB.prepare('SELECT * FROM health_state ORDER BY endpoint').all(),
          env.DB.prepare('SELECT * FROM health_log ORDER BY id DESC LIMIT 100').all(),
        ]);
        return new Response(JSON.stringify({ version: VERSION, states: states.results, recent: recent.results }, null, 2), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
      }
    }
    try {
      const states = env.DB ? (await env.DB.prepare('SELECT * FROM health_state ORDER BY endpoint').all()).results : [];
      return new Response(buildStatusPage(states), { headers: { 'Content-Type': 'text/html' } });
    } catch {
      return new Response(buildStatusPage([]), { headers: { 'Content-Type': 'text/html' } });
    }
  },
};
