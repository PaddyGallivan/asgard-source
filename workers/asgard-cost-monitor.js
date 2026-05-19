// asgard-cost-monitor v1.0.0
//
// Daily pull billing from Anthropic + OpenAI + Stripe (covers Resend, Supabase).
// Stores per-day spend in COST_HISTORY KV. Alert on >25% WoW or projected
// monthly >$1500 AUD.
//
// Bindings: AGENT_PIN, ANTHROPIC_ADMIN_KEY, OPENAI_ADMIN_KEY, STRIPE_API_KEY,
//           COST_HISTORY (KV), TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 22 * * * (8am AEST daily)

const VERSION = '1.0.1';
const WORKER  = 'asgard-cost-monitor';
const MONTHLY_BUDGET_USD = 1000; // ~$1500 AUD

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

async function fetchAnthropic(env, dateIso) {
  if (!env.ANTHROPIC_ADMIN_KEY) return { ok: false, error: 'no key' };
  // Admin API usage endpoint: GET /v1/organizations/usage_report/messages?starting_at=...
  const start = dateIso + 'T00:00:00Z';
  const end = dateIso + 'T23:59:59Z';
  const r = await fetch(`https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${start}&ending_at=${end}&bucket_width=1d`, {
    headers: { 'x-api-key': env.ANTHROPIC_ADMIN_KEY, 'anthropic-version': '2023-06-01' },
  });
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
  const d = await r.json();
  // Sum usd from buckets
  let usd = 0;
  for (const b of (d.data || [])) {
    for (const r of (b.results || [])) {
      usd += (r.cost_usd || 0);
    }
  }
  return { ok: true, usd };
}

async function fetchOpenAI(env, dateIso) {
  if (!env.OPENAI_ADMIN_KEY) return { ok: false, error: 'no key' };
  const start = Math.floor(new Date(dateIso + 'T00:00:00Z').getTime() / 1000);
  const end = start + 86400;
  const r = await fetch(`https://api.openai.com/v1/organization/costs?start_time=${start}&end_time=${end}&bucket_width=1d`, {
    headers: { 'Authorization': `Bearer ${env.OPENAI_ADMIN_KEY}` },
  });
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
  const d = await r.json();
  let usd = 0;
  for (const b of (d.data || [])) {
    for (const r of (b.results || [])) usd += (r.amount?.value || 0);
  }
  return { ok: true, usd };
}

async function fetchStripe(env, dateIso) {
  if (!env.STRIPE_API_KEY) return { ok: false, error: 'no key' };
  const start = Math.floor(new Date(dateIso + 'T00:00:00Z').getTime() / 1000);
  const end = start + 86400;
  // Total of paid invoices for the day
  const r = await fetch(`https://api.stripe.com/v1/invoices?created[gte]=${start}&created[lt]=${end}&status=paid&limit=100`, {
    headers: { 'Authorization': `Bearer ${env.STRIPE_API_KEY}` },
  });
  if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
  const d = await r.json();
  let usd = 0;
  for (const inv of (d.data || [])) usd += (inv.amount_paid || 0) / 100;
  return { ok: true, usd };
}

async function runOnce(env) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const providers = {
    anthropic: await fetchAnthropic(env, yesterday),
    openai:    await fetchOpenAI(env, yesterday),
    stripe:    await fetchStripe(env, yesterday),
  };

  // Persist
  for (const [name, r] of Object.entries(providers)) {
    if (r.ok) await env.COST_HISTORY.put(`${name}:${yesterday}`, JSON.stringify({ usd: r.usd }), { expirationTtl: 400 * 86400 });
  }

  // WoW comparison
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const alerts = [];
  for (const [name, r] of Object.entries(providers)) {
    if (!r.ok) continue;
    const wkAgoRaw = await env.COST_HISTORY.get(`${name}:${sevenAgo}`);
    if (!wkAgoRaw) continue;
    const wkAgo = JSON.parse(wkAgoRaw).usd;
    if (wkAgo < 1) continue;
    const jump = (r.usd - wkAgo) / wkAgo;
    if (jump > 0.25) alerts.push({ provider: name, current: r.usd, week_ago: wkAgo, jump_pct: Math.round(jump * 100) });
  }

  // Monthly projection — parallelize KV reads (was sequential = slow late-month)
  const dayOfMonth = new Date().getUTCDate();
  const keysToFetch = [];
  for (let i = 1; i < dayOfMonth; i++) {
    const d = new Date(); d.setUTCDate(i);
    const dStr = d.toISOString().slice(0, 10);
    for (const name of Object.keys(providers)) {
      keysToFetch.push(`${name}:${dStr}`);
    }
  }
  const fetched = await Promise.all(keysToFetch.map(k => env.COST_HISTORY.get(k)));
  let monthToDate = 0;
  for (const raw of fetched) {
    if (raw) monthToDate += JSON.parse(raw).usd || 0;
  }
  const projected = monthToDate * 30 / Math.max(dayOfMonth - 1, 1);
  if (projected > MONTHLY_BUDGET_USD) {
    alerts.push({ provider: 'TOTAL', projected_monthly_usd: Math.round(projected), budget_usd: MONTHLY_BUDGET_USD });
  }

  const summary = { ts: new Date().toISOString(), date: yesterday, providers, alerts, month_to_date_usd: Math.round(monthToDate) };
  await env.COST_HISTORY.put('last-summary', JSON.stringify(summary));

  if (alerts.length) {
    let msg = `💸 *Cost monitor* — ${alerts.length} alert${alerts.length === 1 ? '' : 's'}\n\n`;
    for (const a of alerts) {
      if (a.provider === 'TOTAL') msg += `• 📊 Projected month: *$${a.projected_monthly_usd}* (budget $${a.budget_usd})\n`;
      else msg += `• \`${a.provider}\`: *$${a.current.toFixed(2)}* yesterday vs $${a.week_ago.toFixed(2)} 7d ago (*+${a.jump_pct}%*)\n`;
    }
    await sendTelegram(env, msg);
  }

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
      const raw = await env.COST_HISTORY.get('last-summary');
      return json({ ok: true, summary: raw ? JSON.parse(raw) : null });
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try { await runOnce(env); }
    catch (e) { await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`); throw e; }
  },
};