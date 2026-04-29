// asgard-watchdog v1.0.0
// Cron: every 5 minutes — checks all Asgard workers + live sites
// State-change alerting via Resend, D1 logging, auto-heal asgard if down

const VERSION = '1.0.0';
const ACCOUNT_ID = 'a6f47c17811ee2f8b6caeb8f38768c20';
const ALERT_FROM = 'Asgard Watchdog <watchdog@luckdragon.io>';
const ALERT_TO = ['paddy@luckdragon.io', 'rooney.jaclyn.l@gmail.com'];

const CHECKS = [
  { name: 'asgard',           url: 'https://asgard.pgallivan.workers.dev/',        type: 'worker', autofix: true  },
  { name: 'asgard-ai',        url: 'https://asgard-ai.pgallivan.workers.dev/',      type: 'worker', autofix: false },
  { name: 'asgard-tools',     url: 'https://asgard-tools.pgallivan.workers.dev/',   type: 'worker', autofix: false },
  { name: 'asgard-brain',     url: 'https://asgard-brain.pgallivan.workers.dev/',   type: 'worker', autofix: false },
  { name: 'asgard-vault',     url: 'https://asgard-vault.pgallivan.workers.dev/health', type: 'worker', autofix: false },
  { name: 'asgard-backup',    url: 'https://asgard-backup.pgallivan.workers.dev/',  type: 'worker', autofix: false },
  { name: 'longrangetipping', url: 'https://longrangetipping.com/',                 type: 'site',   autofix: false },
  { name: 'carnivaltiming',   url: 'https://carnivaltiming.com/',                   type: 'site',   autofix: false },
  { name: 'wps-hub',          url: 'https://wps.carnivaltiming.com/',               type: 'site',   autofix: false },
];

// ─── Endpoint check ────────────────────────────────────────────────────────────
async function checkEndpoint(check) {
  const start = Date.now();
  try {
    const resp = await Promise.race([
      fetch(check.url, { method: 'GET', cf: { cacheEverything: false } }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout after 8s')), 8000)),
    ]);
    const latency = Date.now() - start;
    const ok = resp.status >= 200 && resp.status < 400;
    return { ok, status: resp.status, latency, error: ok ? null : `HTTP ${resp.status}` };
  } catch (e) {
    return { ok: false, status: 0, latency: Date.now() - start, error: e.message };
  }
}

// ─── D1 helpers ────────────────────────────────────────────────────────────────
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
    await db.prepare(`
      INSERT INTO health_state (endpoint, last_ok, last_change, consecutive_failures)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        last_ok = excluded.last_ok,
        last_change = CASE WHEN last_ok != excluded.last_ok THEN excluded.last_change ELSE health_state.last_change END,
        consecutive_failures = excluded.consecutive_failures
    `).bind(name, ok ? 1 : 0, last_change, consecutive_failures).run();
  } catch (e) {
    console.error('setState error:', e.message);
  }
  return { changed, wasOk, consecutive_failures };
}

async function logCheck(db, name, result, now) {
  try {
    await db.prepare(`
      INSERT INTO health_log (check_time, endpoint, status, ok, latency_ms, error)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(now, name, result.status, result.ok ? 1 : 0, result.latency, result.error || null).run();
  } catch (e) {
    console.error('logCheck error:', e.message);
  }
}

// ─── Email ─────────────────────────────────────────────────────────────────────
async function sendAlert(env, subject, htmlBody) {
  if (!env.RESEND_API_KEY) return { sent: false, reason: 'no RESEND_API_KEY' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: ALERT_FROM, to: ALERT_TO, subject, html: htmlBody }),
    });
    const body = await r.text();
    return { sent: r.ok, status: r.status, body: body.slice(0, 200) };
  } catch (e) {
    return { sent: false, error: e.message };
  }
}

// ─── Auto-fix ──────────────────────────────────────────────────────────────────
async function tryAutofix(env, check) {
  if (!check.autofix || !env.X_PIN) return { attempted: false };
  try {
    // Pull latest asgard.js from GitHub
    const srcResp = await fetch('https://raw.githubusercontent.com/PaddyGallivan/asgard-source/main/workers/asgard.js');
    if (!srcResp.ok) return { attempted: true, success: false, error: `GitHub fetch failed: HTTP ${srcResp.status}` };
    const src = await srcResp.text();
    // Base64 encode (UTF-8 safe)
    const bytes = new TextEncoder().encode(src);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    const code_b64 = btoa(binary);
    // Deploy via asgard-tools
    const deployResp = await fetch('https://asgard-tools.pgallivan.workers.dev/admin/deploy', {
      method: 'POST',
      headers: { 'X-Pin': env.X_PIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ worker_name: 'asgard', code_b64, main_module: 'worker.js' }),
    });
    const result = await deployResp.text();
    return { attempted: true, success: deployResp.ok, result: result.slice(0, 300) };
  } catch (e) {
    return { attempted: true, success: false, error: e.message };
  }
}

// ─── Asgard inbox ──────────────────────────────────────────────────────────────
async function postToInbox(db, message) {
  try {
    await db.prepare(`
      INSERT INTO messages (created_at, group_id, role, content, read_by_user)
      VALUES (?, 'watchdog', 'assistant', ?, 0)
    `).bind(new Date().toISOString(), message).run();
  } catch { /* table might differ — silently skip */ }
}

// ─── Main check loop ───────────────────────────────────────────────────────────
async function runChecks(env) {
  const now = new Date().toISOString();
  const db = env.DB;
  if (!db) { console.error('No DB binding'); return; }

  // Run all checks in parallel
  const results = await Promise.all(CHECKS.map(c => checkEndpoint(c)));

  const alerts = [];

  for (let i = 0; i < CHECKS.length; i++) {
    const check = CHECKS[i];
    const result = results[i];

    await logCheck(db, check.name, result, now);
    const stateChange = await setState(db, check.name, result.ok, now);

    if (!stateChange.changed) continue;

    if (!result.ok) {
      // Just went down — attempt auto-fix
      const fixResult = await tryAutofix(env, check);
      alerts.push({ type: 'down', check, result, fixResult, consecutive: stateChange.consecutive_failures });
    } else {
      // Came back up
      alerts.push({ type: 'up', check, result });
    }
  }

  if (alerts.length === 0) return; // All clear, no state changes — stay quiet

  // Build & send email
  const downAlerts = alerts.filter(a => a.type === 'down');
  const subject = downAlerts.length > 0
    ? `🚨 [Asgard] ${downAlerts.map(a => a.check.name).join(', ')} is DOWN`
    : `✅ [Asgard] ${alerts.map(a => a.check.name).join(', ')} recovered`;

  await sendAlert(env, subject, buildAlertEmail(alerts, now));

  // Post to Asgard inbox
  const inboxLines = alerts.map(a => {
    if (a.type === 'down') {
      const fix = a.fixResult?.attempted
        ? (a.fixResult.success ? ' — 🔧 auto-healed' : ' — ❌ auto-heal failed')
        : '';
      return `🔴 **${a.check.name}** DOWN (${a.result.error})${fix}`;
    }
    return `🟢 **${a.check.name}** back UP (${a.result.latency}ms)`;
  });
  await postToInbox(db, `**Watchdog** ${now}\n\n${inboxLines.join('\n')}`);
}

// ─── Email template ────────────────────────────────────────────────────────────
function buildAlertEmail(alerts, now) {
  const rows = alerts.map(a => {
    const bg = a.type === 'down' ? '#fee2e2' : '#dcfce7';
    const icon = a.type === 'down' ? '🔴' : '🟢';
    const status = a.type === 'down' ? 'DOWN' : 'RECOVERED';
    const detail = a.type === 'down'
      ? (a.result.error || 'unknown error')
      : `Latency: ${a.result.latency}ms`;
    const action = a.type === 'down' && a.fixResult?.attempted
      ? (a.fixResult.success ? '✅ Auto-healed' : '❌ Auto-heal failed')
      : '—';
    return `<tr style="background:${bg}">
      <td style="padding:10px 14px;font-weight:bold">${icon} ${a.check.name}</td>
      <td style="padding:10px 14px">${status}</td>
      <td style="padding:10px 14px;font-family:monospace;font-size:12px">${detail}</td>
      <td style="padding:10px 14px">${action}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:32px">
<div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#1a1a2e;padding:24px 28px">
    <h2 style="color:#6366f1;margin:0">⚡ Asgard Watchdog</h2>
    <p style="color:#a0a0cc;margin:6px 0 0;font-size:14px">${now}</p>
  </div>
  <div style="padding:24px 28px">
    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:10px 14px;text-align:left;font-size:13px">Service</th>
          <th style="padding:10px 14px;text-align:left;font-size:13px">Status</th>
          <th style="padding:10px 14px;text-align:left;font-size:13px">Detail</th>
          <th style="padding:10px 14px;text-align:left;font-size:13px">Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:24px;font-size:13px;color:#666">
      Live status: <a href="https://asgard-watchdog.pgallivan.workers.dev/" style="color:#6366f1">asgard-watchdog.pgallivan.workers.dev</a>
    </p>
  </div>
</div>
</body></html>`;
}

// ─── Status page ───────────────────────────────────────────────────────────────
function buildStatusPage(states) {
  const rows = (states || []).map(s => {
    const ok = s.last_ok === 1;
    const badge = ok
      ? '<span style="color:#16a34a;font-weight:bold">● UP</span>'
      : '<span style="color:#dc2626;font-weight:bold">● DOWN</span>';
    const failures = s.consecutive_failures || 0;
    const since = s.last_change ? s.last_change.replace('T', ' ').slice(0, 19) + ' UTC' : '—';
    return `<tr>
      <td style="padding:10px 16px">${s.endpoint}</td>
      <td style="padding:10px 16px">${badge}</td>
      <td style="padding:10px 16px;color:${failures > 0 ? '#dc2626' : '#666'}">${failures}</td>
      <td style="padding:10px 16px;color:#666;font-size:13px">${since}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="padding:16px;color:#666;text-align:center">No data yet — hit /run to trigger first check</td></tr>';

  return `<!DOCTYPE html>
<html><head>
<title>Asgard Watchdog</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:system-ui,sans-serif;background:#0a0a1a;color:#e0e0f0;padding:0;margin:0}
  .wrap{max-width:860px;margin:40px auto;padding:0 20px}
  h1{color:#6366f1;font-size:24px;margin-bottom:4px}
  .sub{color:#a0a0cc;font-size:14px;margin-bottom:28px}
  table{width:100%;border-collapse:collapse;background:#111128;border-radius:10px;overflow:hidden}
  th{background:#1e1e3a;padding:10px 16px;text-align:left;font-size:13px;color:#a0a0cc;font-weight:600}
  tr:not(:last-child) td{border-bottom:1px solid #2a2a5a}
  .actions{margin-top:20px;display:flex;gap:12px;font-size:13px}
  .actions a{color:#6366f1;text-decoration:none;padding:6px 14px;border:1px solid #6366f1;border-radius:6px}
  .actions a:hover{background:#6366f120}
  .ver{margin-top:32px;color:#444;font-size:12px}
</style>
</head>
<body>
<div class="wrap">
  <h1>⚡ Asgard Watchdog</h1>
  <p class="sub">Checks every 5 minutes — state-change alerts only</p>
  <table>
    <thead><tr><th>Service</th><th>Status</th><th>Failures</th><th>Last change</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="actions">
    <a href="/run">▶ Run check now</a>
    <a href="/status">{ } JSON</a>
    <a href="https://asgard.pgallivan.workers.dev">🏰 Asgard</a>
  </div>
  <p class="ver">v${VERSION} · asgard-watchdog.pgallivan.workers.dev</p>
</div>
</body></html>`;
}

// ─── D1 migration ──────────────────────────────────────────────────────────────
async function runMigration(db) {
  const results = [];
  const stmts = [
    `CREATE TABLE IF NOT EXISTS health_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_time TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      status INTEGER,
      ok INTEGER NOT NULL,
      latency_ms INTEGER,
      error TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS health_state (
      endpoint TEXT PRIMARY KEY,
      last_ok INTEGER NOT NULL DEFAULT 1,
      last_change TEXT NOT NULL,
      consecutive_failures INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS idx_health_log_endpoint ON health_log(endpoint)`,
    `CREATE INDEX IF NOT EXISTS idx_health_log_time ON health_log(check_time)`,
  ];
  for (const sql of stmts) {
    try { await db.exec(sql); results.push({ ok: true, sql: sql.slice(0, 60) }); }
    catch (e) { results.push({ ok: false, sql: sql.slice(0, 60), error: e.message }); }
  }
  return results;
}

// ─── Worker export ─────────────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors, 'Access-Control-Allow-Headers': 'Content-Type,X-Pin', 'Access-Control-Allow-Methods': 'GET,POST' } });
    }

    // /run — manual trigger
    if (url.pathname === '/run') {
      ctx.waitUntil(runChecks(env));
      return new Response(JSON.stringify({ ok: true, message: 'Check triggered', ts: new Date().toISOString() }), { headers: cors });
    }

    // /migrate — idempotent D1 table creation
    if (url.pathname === '/migrate') {
      if (!env.DB) return new Response(JSON.stringify({ error: 'No DB binding' }), { status: 500, headers: cors });
      const results = await runMigration(env.DB);
      return new Response(JSON.stringify({ ok: true, results }), { headers: cors });
    }

    // /status — JSON health state + recent log
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

    // / — HTML status dashboard
    try {
      const states = env.DB
        ? (await env.DB.prepare('SELECT * FROM health_state ORDER BY endpoint').all()).results
        : [];
      return new Response(buildStatusPage(states), { headers: { 'Content-Type': 'text/html' } });
    } catch {
      return new Response(buildStatusPage([]), { headers: { 'Content-Type': 'text/html' } });
    }
  },
};
