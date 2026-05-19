// asgard-dns-watcher v1.0.0
//
// Nightly snapshot of every CF zone's DNS records, diff vs yesterday,
// Telegram alert on any add/remove/change. State-change-only alerting.
//
// Bindings: AGENT_PIN, CF_API_TOKEN, CF_ACCOUNT_ID, DNS_SNAPSHOTS (KV),
//           TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 18 * * * (4am AEST daily)

const VERSION = '1.0.0';
const WORKER  = 'asgard-dns-watcher';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } }); }
function err(msg, s = 400) { return json({ ok: false, error: msg }, s); }
function pinOk(request, env) {
  const pin = request.headers.get('X-Pin') || '';
  if (!env.AGENT_PIN) return true;
  return pin === env.AGENT_PIN;
}

async function cfFetch(env, path) {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
  });
  const d = await r.json();
  if (!d.success) throw new Error(`CF ${path}: ${JSON.stringify(d.errors)}`);
  return d;
}

async function listZones(env) {
  const zones = [];
  let page = 1;
  while (true) {
    const d = await cfFetch(env, `/zones?account.id=${env.CF_ACCOUNT_ID}&per_page=50&page=${page}`);
    zones.push(...d.result);
    if (d.result.length < 50) break;
    page++;
  }
  return zones;
}

async function listRecords(env, zoneId) {
  const records = [];
  let page = 1;
  while (true) {
    const d = await cfFetch(env, `/zones/${zoneId}/dns_records?per_page=100&page=${page}`);
    records.push(...d.result);
    if (d.result.length < 100) break;
    page++;
  }
  return records.map(r => ({
    id: r.id,
    type: r.type,
    name: r.name,
    content: r.content,
    proxied: r.proxied,
    ttl: r.ttl,
  })).sort((a, b) => `${a.name}:${a.type}`.localeCompare(`${b.name}:${b.type}`));
}

function diffRecords(prev, curr) {
  const prevMap = new Map(prev.map(r => [`${r.name}:${r.type}:${r.content}`, r]));
  const currMap = new Map(curr.map(r => [`${r.name}:${r.type}:${r.content}`, r]));
  const added = [...currMap.entries()].filter(([k]) => !prevMap.has(k)).map(([_, v]) => v);
  const removed = [...prevMap.entries()].filter(([k]) => !currMap.has(k)).map(([_, v]) => v);
  return { added, removed };
}

async function sendTelegram(env, text) {
  if (env.TELEGRAM_QUIET === 'true') return;
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
  });
}

async function runOnce(env) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10);
  const zones = await listZones(env);
  const summary = { ts: new Date().toISOString(), zones: [], added: 0, removed: 0 };

  for (const z of zones) {
    let curr;
    try { curr = await listRecords(env, z.id); }
    catch (e) { summary.zones.push({ name: z.name, error: e.message }); continue; }

    const todayKey = `${z.name}:${today}`;
    const yesterdayKey = `${z.name}:${yesterday}`;
    await env.DNS_SNAPSHOTS.put(todayKey, JSON.stringify(curr), { expirationTtl: 30 * 86400 });

    const prevRaw = await env.DNS_SNAPSHOTS.get(yesterdayKey);
    if (!prevRaw) { summary.zones.push({ name: z.name, count: curr.length, first_snapshot: true }); continue; }
    const prev = JSON.parse(prevRaw);
    const d = diffRecords(prev, curr);
    summary.zones.push({ name: z.name, count: curr.length, added: d.added.length, removed: d.removed.length });
    summary.added += d.added.length;
    summary.removed += d.removed.length;

    if (d.added.length || d.removed.length) {
      let msg = `🌐 *DNS change in ${z.name}*\n\n`;
      if (d.added.length) {
        msg += `*Added (${d.added.length}):*\n`;
        d.added.slice(0, 5).forEach(r => { msg += `  + \`${r.type} ${r.name}\` → ${r.content}\n`; });
        if (d.added.length > 5) msg += `  …and ${d.added.length - 5} more\n`;
      }
      if (d.removed.length) {
        msg += `*Removed (${d.removed.length}):*\n`;
        d.removed.slice(0, 5).forEach(r => { msg += `  − \`${r.type} ${r.name}\` → ${r.content}\n`; });
        if (d.removed.length > 5) msg += `  …and ${d.removed.length - 5} more\n`;
      }
      await sendTelegram(env, msg);
    }
  }

  await env.DNS_SNAPSHOTS.put('last-summary', JSON.stringify(summary), { expirationTtl: 30 * 86400 });
  return summary;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (path === '/health') return json({ ok: true, worker: WORKER, version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);

    if (path === '/run' && request.method === 'POST') {
      try { return json({ ok: true, summary: await runOnce(env) }); }
      catch (e) { return err('run failed: ' + e.message, 500); }
    }

    if (path === '/report' && request.method === 'GET') {
      const raw = await env.DNS_SNAPSHOTS.get('last-summary');
      return json({ ok: true, summary: raw ? JSON.parse(raw) : null });
    }

    return err('Not found', 404);
  },

  async scheduled(event, env, ctx) {
    try { await runOnce(env); }
    catch (e) {
      await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`);
      throw e;
    }
  },
};