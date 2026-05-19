// asgard-domain-expiry v1.0.0
//
// Cross-registrar domain expiry watch. Phase 1: CF Registrar only.
// Phase 2/3 (VentraIP, Squarespace) deferred — add when API creds available.
//
// Alerts at 60, 30, 14 days. State-change-only (won't re-alert daily for the
// same domain at the same threshold).
//
// Bindings: AGENT_PIN, CF_API_TOKEN, CF_ACCOUNT_ID, DOMAIN_EXPIRY_STATE (KV),
//           TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 20 * * 1 (Monday 6am AEST)

const VERSION = '1.0.0';
const WORKER  = 'asgard-domain-expiry';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

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

async function listCfRegistrarDomains(env) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/registrar/domains?per_page=100`, {
    headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
  });
  const d = await r.json();
  if (!d.success) throw new Error(`CF registrar: ${JSON.stringify(d.errors)}`);
  return (d.result || []).map(x => ({
    name: x.name,
    expires_at: x.expires_at,
    registrar: 'cloudflare',
    auto_renew: x.auto_renew,
    locked: x.locked,
  }));
}

function daysUntil(iso) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
}

function thresholdFor(days) {
  if (days <= 14) return 14;
  if (days <= 30) return 30;
  if (days <= 60) return 60;
  return null;
}

async function runOnce(env) {
  const stateRaw = await env.DOMAIN_EXPIRY_STATE.get('last-alerts');
  const lastAlerts = stateRaw ? JSON.parse(stateRaw) : {};
  const newAlerts = {};
  const domains = await listCfRegistrarDomains(env);
  const summary = { ts: new Date().toISOString(), domains: [], alerts: [] };

  for (const d of domains) {
    if (!d.expires_at) { summary.domains.push({ ...d, days: null }); continue; }
    const days = daysUntil(d.expires_at);
    const threshold = thresholdFor(days);
    summary.domains.push({ ...d, days });
    if (threshold !== null) {
      const prevThreshold = lastAlerts[d.name];
      newAlerts[d.name] = threshold;
      // alert only if crossing into a tighter window than last time
      if (prevThreshold === undefined || threshold < prevThreshold) {
        summary.alerts.push({ name: d.name, days, threshold, expires_at: d.expires_at, auto_renew: d.auto_renew });
      }
    }
  }

  if (summary.alerts.length) {
    let msg = `📅 *Domain expiry alert* — ${summary.alerts.length} domain${summary.alerts.length === 1 ? '' : 's'}\n\n`;
    for (const a of summary.alerts) {
      const renew = a.auto_renew ? '✓ auto-renew' : '⚠️ no auto-renew';
      msg += `• \`${a.name}\` — *${a.days}d* (expires ${a.expires_at.slice(0, 10)}) — ${renew}\n`;
    }
    await sendTelegram(env, msg);
  }

  await env.DOMAIN_EXPIRY_STATE.put('last-alerts', JSON.stringify(newAlerts));
  await env.DOMAIN_EXPIRY_STATE.put('last-summary', JSON.stringify(summary));
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
      const raw = await env.DOMAIN_EXPIRY_STATE.get('last-summary');
      return json({ ok: true, summary: raw ? JSON.parse(raw) : null });
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try { await runOnce(env); }
    catch (e) { await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`); throw e; }
  },
};