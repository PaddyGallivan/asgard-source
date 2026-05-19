const VERSION = '1.1.0';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
function err(msg, s = 400) { return json({ ok: false, error: msg }, s); }
function pinOk(request, env) {
  const pin = request.headers.get('X-Pin') || '';
  if (!env.AGENT_PIN) return true;
  return pin === env.AGENT_PIN;
}

// ââ Provider probes ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Each returns { ok: bool, status?: int, info?: string, error?: string }

async function probeAnthropic(key) {
  try {
    const r = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    });
    if (r.ok) {
      const d = await r.json();
      return { ok: true, status: r.status, info: `${(d.data || []).length} models` };
    }
    return { ok: false, status: r.status, error: await r.text() };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function probeOpenAI(key) {
  try {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    if (r.ok) {
      const d = await r.json();
      return { ok: true, status: r.status, info: `${(d.data || []).length} models` };
    }
    return { ok: false, status: r.status, error: await r.text() };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function probeResend(key) {
  try {
    const r = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    if (r.ok) {
      const d = await r.json();
      return { ok: true, status: r.status, info: `${(d.data || []).length} domains` };
    }
    return { ok: false, status: r.status, error: await r.text() };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function probeCloudflareToken(token) {
  try {
    const r = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const d = await r.json();
    if (d.success && d.result?.status === 'active') {
      return { ok: true, status: r.status, info: `token id ${d.result.id?.substring(0, 8)}` };
    }
    return { ok: false, status: r.status, error: JSON.stringify(d.errors || d) };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function probeGitHub(token) {
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'asgard-vault-healthcheck/1.0',
      },
    });
    if (r.ok) {
      const d = await r.json();
      return { ok: true, status: r.status, info: `user ${d.login}` };
    }
    return { ok: false, status: r.status, error: await r.text() };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function probeSupabase(serviceKey) {
  // Service key is a JWT; we can't fully verify without project URL.
  // At minimum, sanity-check format.
  if (typeof serviceKey !== 'string' || serviceKey.split('.').length !== 3) {
    return { ok: false, error: 'not a JWT-shaped value' };
  }
  return { ok: true, info: 'JWT format ok (no network verify)' };
}

// ââ Key registry âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Map of KV key name â probe function + provider label.
// Add new keys here as the vault grows.
const REGISTRY = [
  { kvKey: 'ANTHROPIC_API_KEY', probe: probeAnthropic, provider: 'Anthropic' },
  { kvKey: 'OPENAI_API_KEY', probe: probeOpenAI, provider: 'OpenAI' },
  { kvKey: 'RESEND_API_KEY', probe: probeResend, provider: 'Resend' },
  { kvKey: 'CF_FULLOPS_TOKEN', probe: probeCloudflareToken, provider: 'Cloudflare (fullops)' },
  { kvKey: 'CF_ZONE_ADMIN_TOKEN', probe: probeCloudflareToken, provider: 'Cloudflare (zone)' },
  { kvKey: 'CF_API_TOKEN', probe: probeCloudflareToken, provider: 'Cloudflare (default)' },
  { kvKey: 'GITHUB_TOKEN', probe: probeGitHub, provider: 'GitHub' },
  { kvKey: 'SUPABASE_SERVICE_KEY', probe: probeSupabase, provider: 'Supabase' },
];

// ââ Telegram alert âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
async function notifyTelegram(env, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { skipped: 'no telegram credentials' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  
  // #19: Persist updated meta
  if (env.ASGARD_VAULT_META) {
    await env.ASGARD_VAULT_META.put('all', JSON.stringify(_metaParsed)).catch(() => {});
  }

  return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ââ Run the full audit âââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function shannonEntropy(s) {
  if (!s || s.length === 0) return 0;
  const freq = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  let h = 0;
  for (const c of Object.values(freq)) {
    const p = c / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

async function runAudit(env) {
  if (!env.ASGARD_VAULT) throw new Error('ASGARD_VAULT binding missing');

  const startedAt = new Date().toISOString();
  const results = [];
  // #19: Load/init ASGARD_VAULT_META for age + entropy tracking
  let _metaParsed = {};
  if (env.ASGARD_VAULT_META) {
    try {
      const _metaRaw = await env.ASGARD_VAULT_META.get('all');
      _metaParsed = _metaRaw ? JSON.parse(_metaRaw) : {};
    } catch (_) {}
  }

  for (const entry of REGISTRY) {
    const value = await env.ASGARD_VAULT.get(entry.kvKey);
    if (!value) {
      // Alert if age > 365 and no rotation override
    if (_ageDays > 365 && !(_metaParsed[entry.kvKey] || {}).no_rotation_warn) {
      results.push({ key: entry.kvKey, provider: entry.provider, present: true, ok: false, error: `age:${_ageDays}d — needs rotation`, entropy: _entropy });
    }
    results.push({
        key: entry.kvKey,
        age_days: _ageDays,
        entropy: _entropy,
        findings: _findings,
        provider: entry.provider,
        present: false,
        ok: null,
        skipped: 'key not in vault',
      });
      continue;
    }
    let probeResult;
    try { probeResult = await entry.probe(value); }
    catch (e) { probeResult = { ok: false, error: 'probe threw: ' + e.message }; }

    // #19: age + entropy audit
    const _ageMeta = _metaParsed[entry.kvKey];
    if (!_ageMeta) {
      _metaParsed[entry.kvKey] = { last_rotated: new Date().toISOString().slice(0, 10), source: 'initial-backfill' };
    }
    const _ageMs = Date.now() - new Date((_metaParsed[entry.kvKey] || {}).last_rotated || new Date().toISOString().slice(0,10)).getTime();
    const _ageDays = Math.floor(_ageMs / 86400000);
    const _entropy = shannonEntropy(value);
    const _findings = [];
    if (_ageDays > 180) _findings.push('age:' + _ageDays + 'd');
    if (_entropy < 3.5) _findings.push('entropy:' + _entropy.toFixed(2));
    results.push({
      key: entry.kvKey,
      provider: entry.provider,
      present: true,
      ...probeResult,
    });
  }

  const finishedAt = new Date().toISOString();
  const failed = results.filter(r => r.present && r.ok === false);
  const summary = {
    startedAt,
    finishedAt,
    total: results.length,
    present: results.filter(r => r.present).length,
    passed: results.filter(r => r.ok === true).length,
    failed: failed.length,
    results,
  };

  // Persist to HEALTH_STATE KV
  if (env.HEALTH_STATE) {
    await env.HEALTH_STATE.put('last_run', JSON.stringify(summary));
    await env.HEALTH_STATE.put(`run:${startedAt}`, JSON.stringify(summary), {
      expirationTtl: 60 * 60 * 24 * 90, // keep 90 days of run history
    });
  }

  // Alert ONLY on state change vs previous run (or if env.TELEGRAM_QUIET set, never)
  // Reads previous run's failed key set; alerts only if newly-failed or newly-recovered.
  const failedSet = new Set(failed.map(f => f.key));
  let prevFailedSet = new Set();
  if (env.HEALTH_STATE) {
    try {
      const prev = await env.HEALTH_STATE.get('last_run', 'json');
      prevFailedSet = new Set((prev?.results || []).filter(r => r.present && r.ok === false).map(r => r.key));
    } catch (_) {}
  }
  const newlyFailed = [...failedSet].filter(k => !prevFailedSet.has(k));
  const recovered = [...prevFailedSet].filter(k => !failedSet.has(k));
  summary.deltaSinceLastRun = { newlyFailed, recovered };

  if (env.TELEGRAM_QUIET === 'true') {
    summary.alertSent = { skipped: 'TELEGRAM_QUIET=true' };
  } else if (newlyFailed.length > 0 || recovered.length > 0) {
    const lines = [];
    if (newlyFailed.length) {
      lines.push(`*Newly failing:*`);
      for (const k of newlyFailed) {
        const f = failed.find(x => x.key === k);
        lines.push(`â¢ *${k}* (${f.provider}): ${f.error || `HTTP ${f.status}`}`);
      }
    }
    if (recovered.length) {
      lines.push(`*Recovered:* ${recovered.join(', ')}`);
    }
    const msg = [`ð¨ *Asgard vault healthcheck* â state change`, `Run: ${startedAt}`, ``, ...lines].join('\n');
    summary.alertSent = await notifyTelegram(env, msg);
  } else {
    summary.alertSent = { skipped: failed.length > 0 ? 'same failures as last run' : 'no failures' };
  }

  return summary;
}

// ââ HTTP & cron handlers âââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: 'asgard-vault-healthcheck', version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);

    if (path === '/report' && request.method === 'GET') {
      if (!env.HEALTH_STATE) return err('HEALTH_STATE not bound', 500);
      const data = await env.HEALTH_STATE.get('last_run');
      if (!data) return json({ ok: true, message: 'no runs yet â POST /run to bootstrap' });
      return new Response(data, { headers: { 'Content-Type': 'application/json', ...CORS } });
    }

    if (path === '/run' && request.method === 'POST') {
      try { return json(await runAudit(env)); }
      catch (e) { return err('Audit failed: ' + e.message, 500); }
    }

    return err('Not found', 404);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runAudit(env).catch(e => console.error('Cron audit failed:', e)));
  },
};