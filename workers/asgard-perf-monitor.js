// asgard-perf-monitor v1.0.0
//
// Daily pull p50/p95/req-count/err-rate per worker from CF GraphQL Analytics.
// Trailing 7-day baseline stored in PERF_BASELINES KV. Alert on >2σ drift.
//
// Bindings: AGENT_PIN, CF_API_TOKEN, CF_ACCOUNT_ID, PERF_BASELINES (KV),
//           TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 23 * * * (9am AEST daily)

const VERSION = '1.0.1';
const WORKER  = 'asgard-perf-monitor';

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

const GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

async function fetchPerf(env, since, until) {
  // workersInvocationsAdaptive groups by scriptName. Quantile fields are
  // durationP50/P99 (wallclock) and cpuTimeP50/P99 (CPU). NOT "wallTimeP50".
  const query = `query($acct:String!,$since:Time!,$until:Time!){
    viewer{accounts(filter:{accountTag:$acct}){
      workersInvocationsAdaptive(
        filter:{datetime_geq:$since,datetime_leq:$until},
        limit:10000,
        orderBy:[scriptName_ASC]
      ){
        sum{requests,errors,subrequests}
        quantiles{cpuTimeP50,cpuTimeP99,durationP50,durationP99}
        dimensions{scriptName}
      }
    }}
  }`;
  const r = await fetch(GRAPHQL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { acct: env.CF_ACCOUNT_ID, since, until } }),
  });
  const d = await r.json();
  if (d.errors) throw new Error(`GraphQL: ${JSON.stringify(d.errors)}`);
  const rows = d.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive || [];
  return rows.map(x => ({
    worker: x.dimensions?.scriptName || 'unknown',
    requests: x.sum?.requests || 0,
    errors: x.sum?.errors || 0,
    p50: x.quantiles?.durationP50 || 0,
    p95: x.quantiles?.durationP99 || 0, // use P99 since P95 isn't a CF quantile field
    cpuP50: x.quantiles?.cpuTimeP50 || 0,
    cpuP99: x.quantiles?.cpuTimeP99 || 0,
  }));
}

function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

async function runOnce(env) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const now = new Date().toISOString();

  // Today's (last 24h) metrics
  const todayMetrics = await fetchPerf(env, yesterday, now);
  // Trailing 7-day baseline window
  const baselineMetrics = await fetchPerf(env, sevenAgo, yesterday);

  // Aggregate baseline to per-worker p95 and err_rate arrays for stddev
  const baselineByWorker = {};
  for (const m of baselineMetrics) {
    (baselineByWorker[m.worker] ||= { p95s: [], errRates: [] });
    baselineByWorker[m.worker].p95s.push(m.p95 || 0);
    const er = m.requests > 0 ? m.errors / m.requests : 0;
    baselineByWorker[m.worker].errRates.push(er);
  }

  const alerts = [];
  const summary = { ts: new Date().toISOString(), workers: [] };

  for (const m of todayMetrics) {
    if (m.requests < 100) continue; // skip idle workers
    const baseline = baselineByWorker[m.worker];
    const errRate = m.requests > 0 ? m.errors / m.requests : 0;
    const entry = { worker: m.worker, requests: m.requests, p95: m.p95, err_rate: errRate };
    if (baseline) {
      const p95Mean = mean(baseline.p95s);
      const p95Std = stddev(baseline.p95s);
      const errMean = mean(baseline.errRates);
      const errStd = stddev(baseline.errRates);
      entry.p95_baseline = p95Mean;
      entry.err_baseline = errMean;
      if (p95Std > 0 && m.p95 > p95Mean + 2 * p95Std) {
        alerts.push({ worker: m.worker, metric: 'p95', current: m.p95, baseline: p95Mean, stddev: p95Std });
      }
      if (errStd > 0 && errRate > errMean + 2 * errStd && errRate > 0.01) {
        alerts.push({ worker: m.worker, metric: 'err_rate', current: errRate, baseline: errMean, stddev: errStd });
      }
    }
    summary.workers.push(entry);
  }

  // Persist baseline keys (rolling)
  for (const m of todayMetrics) {
    if (m.requests < 100) continue;
    await env.PERF_BASELINES.put(`${m.worker}:${today}`, JSON.stringify({ p95: m.p95, err: m.requests > 0 ? m.errors / m.requests : 0 }), { expirationTtl: 14 * 86400 });
  }
  await env.PERF_BASELINES.put('last-summary', JSON.stringify({ ...summary, alerts }));

  if (alerts.length) {
    let msg = `📉 *Perf regression* — ${alerts.length} signal${alerts.length === 1 ? '' : 's'}\n\n`;
    for (const a of alerts.slice(0, 10)) {
      if (a.metric === 'p95') msg += `• \`${a.worker}\` p95 ${Math.round(a.current)}ms vs baseline ${Math.round(a.baseline)}ms (±${Math.round(a.stddev)})\n`;
      else msg += `• \`${a.worker}\` err ${(a.current * 100).toFixed(1)}% vs baseline ${(a.baseline * 100).toFixed(1)}%\n`;
    }
    await sendTelegram(env, msg);
  }

  return { ...summary, alerts };
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
      const raw = await env.PERF_BASELINES.get('last-summary');
      return json({ ok: true, summary: raw ? JSON.parse(raw) : null });
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try { await runOnce(env); }
    catch (e) { await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`); throw e; }
  },
};