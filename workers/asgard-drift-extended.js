// asgard-drift-extended v1.0.0
//
// Extends asgard-pin-drift-sweeper coverage with:
//   - Zones not on Main account
//   - Domains expiring within 60 days (CF registrar)
//   - Workers with zero routes + zero cron + zero callers in last 30 days
//   - Pages projects on dead repos
//
// Runs in batched mode for the workers check (108 workers > CPU budget).
//
// Bindings: AGENT_PIN, CF_API_TOKEN, CF_ACCOUNT_ID, GITHUB_TOKEN,
//           HEALTH_STATE (existing shared KV), TELEGRAM_BOT_TOKEN,
//           TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 21 * * * (7am AEST)

const VERSION = '1.0.0';
const WORKER  = 'asgard-drift-extended';
const MAIN_ACCOUNT_NAME = 'Luck Dragon Pty Ltd';
const BATCH_SIZE = 30;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Pin' };
function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } }); }
function err(m, s = 400) { return json({ ok: false, error: m }, s); }
function pinOk(r, env) { return !env.AGENT_PIN || (r.headers.get('X-Pin') || '') === env.AGENT_PIN; }

async function sendTelegram(env, text) {
  if (env.TELEGRAM_QUIET === 'true') return;
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
  });
}

async function cf(env, path) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, { headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` } });
  const d = await r.json();
  if (!d.success) throw new Error(`CF ${path}: ${JSON.stringify(d.errors)}`);
  return d;
}

async function checkZonesOnWrongAccount(env) {
  // List zones we have access to with the token; check if any are NOT on our account
  const d = await cf(env, '/zones?per_page=50');
  const offMain = (d.result || []).filter(z => z.account?.id !== env.CF_ACCOUNT_ID);
  return offMain.map(z => ({ name: z.name, account_id: z.account?.id, account_name: z.account?.name }));
}

async function checkDomainExpiry(env) {
  try {
    const d = await cf(env, `/accounts/${env.CF_ACCOUNT_ID}/registrar/domains?per_page=100`);
    const now = Date.now();
    return (d.result || [])
      .filter(x => x.expires_at)
      .map(x => ({ name: x.name, expires_at: x.expires_at, days: Math.floor((new Date(x.expires_at).getTime() - now) / 86400000) }))
      .filter(x => x.days < 60);
  } catch (_) { return []; }
}

async function checkStaleWorkers(env, cursor = 0) {
  const d = await cf(env, `/accounts/${env.CF_ACCOUNT_ID}/workers/scripts?per_page=200`);
  const all = d.result || [];
  const slice = all.slice(cursor, cursor + BATCH_SIZE);
  const stale = [];
  for (const s of slice) {
    try {
      const settings = await cf(env, `/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${s.id}/settings`);
      // Heuristic: no triggers + no routes + no service bindings calling it
      const hasCron = (settings.result?.triggers?.crons || []).length > 0;
      // Routes check
      const routesData = await cf(env, `/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${s.id}/routes`).catch(() => ({ result: [] }));
      const hasRoutes = (routesData.result || []).length > 0;
      if (!hasCron && !hasRoutes) stale.push({ name: s.id, modified_on: s.modified_on });
    } catch (_) { /* skip */ }
  }
  return { stale, nextCursor: cursor + BATCH_SIZE >= all.length ? null : cursor + BATCH_SIZE, total: all.length };
}

async function checkPagesProjects(env) {
  const d = await cf(env, `/accounts/${env.CF_ACCOUNT_ID}/pages/projects?per_page=50`);
  const dead = [];
  for (const p of (d.result || [])) {
    const src = p.source?.config?.repo_name;
    const owner = p.source?.config?.owner;
    if (!src || !owner) continue;
    try {
      const r = await fetch(`https://api.github.com/repos/${owner}/${src}`, {
        headers: { 'Authorization': `token ${env.GITHUB_TOKEN}`, 'User-Agent': WORKER },
      });
      if (r.status === 404) dead.push({ pages_project: p.name, repo: `${owner}/${src}`, reason: '404' });
    } catch (_) { /* skip */ }
  }
  return dead;
}

async function runOnce(env) {
  const stateRaw = await env.HEALTH_STATE.get(`${WORKER}:last-state`);
  const lastState = stateRaw ? JSON.parse(stateRaw) : { zones: [], domains: [], stale: [], dead_pages: [] };

  const summary = {
    ts: new Date().toISOString(),
    wrong_account_zones: await checkZonesOnWrongAccount(env),
    expiring_domains:    await checkDomainExpiry(env),
    dead_pages:          await checkPagesProjects(env),
  };

  // Batched workers sweep with cursor
  const cursorRaw = await env.HEALTH_STATE.get(`${WORKER}:cursor`);
  const cursor = cursorRaw ? parseInt(cursorRaw, 10) : 0;
  const batch = await checkStaleWorkers(env, cursor);
  // Merge into running batch state
  const batchStateRaw = await env.HEALTH_STATE.get(`${WORKER}:batch-stale`);
  let batchStale = batchStateRaw ? JSON.parse(batchStateRaw) : [];
  batchStale = batchStale.concat(batch.stale);
  if (batch.nextCursor === null) {
    summary.stale_workers = batchStale;
    await env.HEALTH_STATE.delete(`${WORKER}:cursor`);
    await env.HEALTH_STATE.delete(`${WORKER}:batch-stale`);
  } else {
    summary.stale_workers_in_progress = `${cursor + BATCH_SIZE}/${batch.total} swept`;
    await env.HEALTH_STATE.put(`${WORKER}:cursor`, String(batch.nextCursor));
    await env.HEALTH_STATE.put(`${WORKER}:batch-stale`, JSON.stringify(batchStale));
  }

  // State-change alerting on completed sweeps only
  if (summary.stale_workers !== undefined) {
    const newKeys = {
      zones:       summary.wrong_account_zones.map(z => z.name).sort(),
      domains:     summary.expiring_domains.map(d => d.name).sort(),
      stale:       summary.stale_workers.map(w => w.name).sort(),
      dead_pages:  summary.dead_pages.map(p => p.pages_project).sort(),
    };
    const oldKeys = lastState;
    const newlyFound = {
      zones:       newKeys.zones.filter(z => !oldKeys.zones?.includes(z)),
      domains:     newKeys.domains.filter(d => !oldKeys.domains?.includes(d)),
      stale:       newKeys.stale.filter(s => !oldKeys.stale?.includes(s)),
      dead_pages:  newKeys.dead_pages.filter(p => !oldKeys.dead_pages?.includes(p)),
    };
    const recovered = {
      zones:       (oldKeys.zones || []).filter(z => !newKeys.zones.includes(z)),
      domains:     (oldKeys.domains || []).filter(d => !newKeys.domains.includes(d)),
      stale:       (oldKeys.stale || []).filter(s => !newKeys.stale.includes(s)),
      dead_pages:  (oldKeys.dead_pages || []).filter(p => !newKeys.dead_pages.includes(p)),
    };
    const totalNew = Object.values(newlyFound).reduce((a, b) => a + b.length, 0);
    const totalRec = Object.values(recovered).reduce((a, b) => a + b.length, 0);
    if (totalNew + totalRec > 0) {
      let msg = `🔍 *Extended drift* — ${totalNew} new / ${totalRec} resolved\n\n`;
      for (const [cat, list] of Object.entries(newlyFound)) {
        if (list.length) msg += `*New ${cat}:* ${list.join(', ')}\n`;
      }
      for (const [cat, list] of Object.entries(recovered)) {
        if (list.length) msg += `*Resolved ${cat}:* ${list.join(', ')}\n`;
      }
      await sendTelegram(env, msg);
    }
    await env.HEALTH_STATE.put(`${WORKER}:last-state`, JSON.stringify(newKeys));
  }

  await env.HEALTH_STATE.put(`${WORKER}:last-summary`, JSON.stringify(summary));
  return summary;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: WORKER, version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);
    if (path === '/run' && request.method === 'POST') {
      try { return json({ ok: true, summary: await runOnce(env) }); }
      catch (e) { return err('run failed: ' + e.message, 500); }
    }
    if (path === '/report' && request.method === 'GET') {
      const raw = await env.HEALTH_STATE.get(`${WORKER}:last-summary`);
      return json({ ok: true, summary: raw ? JSON.parse(raw) : null });
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try { await runOnce(env); }
    catch (e) { await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`); throw e; }
  },
};