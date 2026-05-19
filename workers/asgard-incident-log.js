// asgard-incident-log v1.0.0
//
// Foundational logging endpoint. All other hardening workers POST here on
// caught exceptions or notable state-changes. Weekly cron emits digest.
//
// Bindings: AGENT_PIN, INCIDENT_LOG (KV), TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 19 * * 1 (Monday 5am AEST)

const VERSION = '1.0.0';
const WORKER  = 'asgard-incident-log';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function err(msg, s = 400) { return json({ ok: false, error: msg }, s); }
function pinOk(request, env) {
  const pin = request.headers.get('X-Pin') || '';
  if (!env.AGENT_PIN) return true;
  return pin === env.AGENT_PIN;
}

async function sendTelegram(env, text) {
  if (env.TELEGRAM_QUIET === 'true') return { ok: true, quieted: true };
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { ok: false, error: 'telegram unbound' };
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
  });
  return { ok: r.ok, status: r.status };
}

async function logIncident(env, entry) {
  const ts = entry.ts || new Date().toISOString();
  const key = `${ts}:${entry.worker || 'unknown'}:${Math.random().toString(36).slice(2, 8)}`;
  const value = {
    ts,
    worker: entry.worker || 'unknown',
    severity: entry.severity || 'error',
    message: entry.message || '',
    meta: entry.meta || {},
  };
  // 90-day TTL
  await env.INCIDENT_LOG.put(key, JSON.stringify(value), { expirationTtl: 90 * 86400 });
  return { ok: true, key };
}

async function listSince(env, sinceIso) {
  const since = sinceIso || new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const list = await env.INCIDENT_LOG.list({ prefix: '' });
  const items = [];
  for (const k of list.keys) {
    if (k.name < since) continue;
    const raw = await env.INCIDENT_LOG.get(k.name);
    if (raw) items.push(JSON.parse(raw));
  }
  items.sort((a, b) => a.ts.localeCompare(b.ts));
  return items;
}

async function buildDigest(env) {
  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const items = await listSince(env, since);
  if (items.length === 0) {
    return { md: `📊 *Weekly incident digest* — no incidents in last 7 days.`, count: 0 };
  }
  const byWorker = {};
  for (const i of items) {
    (byWorker[i.worker] ||= []).push(i);
  }
  let md = `📊 *Weekly incident digest* — ${items.length} incident${items.length === 1 ? '' : 's'} since ${since.slice(0, 10)}\n\n`;
  for (const [w, list] of Object.entries(byWorker)) {
    md += `*${w}* (${list.length})\n`;
    for (const i of list.slice(0, 5)) {
      md += `  • ${i.ts.slice(11, 16)} — ${i.severity}: ${i.message.slice(0, 80)}\n`;
    }
    if (list.length > 5) md += `  …and ${list.length - 5} more\n`;
    md += '\n';
  }
  return { md, count: items.length };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (path === '/health') return json({ ok: true, worker: WORKER, version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);

    if (path === '/log' && request.method === 'POST') {
      try {
        const body = await request.json();
        return json(await logIncident(env, body));
      } catch (e) { return err('log failed: ' + e.message, 500); }
    }

    if (path === '/list' && request.method === 'GET') {
      try {
        const since = url.searchParams.get('since');
        return json({ ok: true, items: await listSince(env, since) });
      } catch (e) { return err('list failed: ' + e.message, 500); }
    }

    if (path === '/digest' && request.method === 'POST') {
      try {
        const d = await buildDigest(env);
        await sendTelegram(env, d.md);
        return json({ ok: true, count: d.count });
      } catch (e) { return err('digest failed: ' + e.message, 500); }
    }

    if (path === '/report' && request.method === 'GET') {
      const d = await buildDigest(env);
      return json({ ok: true, ...d });
    }

    return err('Not found', 404);
  },

  async scheduled(event, env, ctx) {
    try {
      const d = await buildDigest(env);
      await sendTelegram(env, d.md);
    } catch (e) {
      await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`);
      throw e;
    }
  },
};