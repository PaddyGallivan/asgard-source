// asgard-auto-rotate v1.0.0
//
// Event-triggered (no cron). Called by asgard-vault-healthcheck when a key
// fails verification and AUTO_ROTATE_ENABLED is true. Mints a new key with
// the provider, writes it to vault, updates worker bindings, sends receipt.
//
// Phase 1 providers: Anthropic, Resend. Others surface manual-rotate notices.
//
// Bindings: AGENT_PIN, ANTHROPIC_ADMIN_KEY, RESEND_API_KEY,
//           ASGARD_VAULT_WRITE_PIN, CF_API_TOKEN, CF_ACCOUNT_ID,
//           TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET

const VERSION = '1.0.1';
const WORKER  = 'asgard-auto-rotate';
const SUBREQUEST_BATCH = 10; // CF caps subrequests per worker invocation
const VAULT_URL = 'https://asgard-vault.luckdragon.io';

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

// ── Anthropic key mint ───────────────────────────────────────────────────────
async function mintAnthropic(env, label) {
  // POST /v1/organizations/api_keys (admin-keys required)
  const r = await fetch('https://api.anthropic.com/v1/organizations/api_keys', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_ADMIN_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: label || `auto-rotated-${new Date().toISOString().slice(0, 10)}` }),
  });
  if (!r.ok) throw new Error(`anthropic mint HTTP ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return { value: d.api_key || d.key, id: d.id };
}

// ── Resend key mint ──────────────────────────────────────────────────────────
async function mintResend(env, label) {
  const r = await fetch('https://api.resend.com/api-keys', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: label || `auto-rotated-${new Date().toISOString().slice(0, 10)}`, permission: 'full_access' }),
  });
  if (!r.ok) throw new Error(`resend mint HTTP ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return { value: d.token, id: d.id };
}

async function writeVault(env, keyName, value) {
  const r = await fetch(`${VAULT_URL}/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Pin': env.ASGARD_VAULT_WRITE_PIN },
    body: JSON.stringify({ key: keyName, value }),
  });
  if (!r.ok) throw new Error(`vault write HTTP ${r.status}`);
  return await r.json();
}

async function listBindingsContaining(env, keyName) {
  // Heuristic: list all workers and check their bindings for a `secret_text`
  // binding whose name matches `keyName`. Batched to respect CF's subrequest
  // limit (~50/invocation; we batch in groups of 10 with Promise.all).
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts?per_page=200`, {
    headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
  });
  const d = await r.json();
  const scripts = (d.result || []);
  const matched = [];
  for (let i = 0; i < scripts.length; i += SUBREQUEST_BATCH) {
    const batch = scripts.slice(i, i + SUBREQUEST_BATCH);
    const results = await Promise.all(batch.map(async (s) => {
      try {
        const settings = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${s.id}/settings`, {
          headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` },
        });
        const sd = await settings.json();
        if ((sd.result?.bindings || []).some(b => b.type === 'secret_text' && b.name === keyName)) {
          return s.id;
        }
      } catch (_) {}
      return null;
    }));
    for (const id of results) if (id) matched.push(id);
  }
  return matched;
}

async function setWorkerSecret(env, worker, keyName, value) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${worker}/secrets`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: keyName, text: value, type: 'secret_text' }),
  });
  return r.ok;
}

async function rotate(env, { provider, key_name }) {
  let minted;
  if (provider === 'anthropic') minted = await mintAnthropic(env, key_name);
  else if (provider === 'resend') minted = await mintResend(env, key_name);
  else {
    // unsupported — send manual notice and bail
    await sendTelegram(env, `⚠️ Auto-rotate unsupported for \`${provider}:${key_name}\` — rotate manually.`);
    return { ok: false, error: `provider ${provider} not in phase 1 (manual rotate required)` };
  }

  await writeVault(env, key_name, minted.value);
  const workers = await listBindingsContaining(env, key_name);
  const results = [];
  for (const w of workers) {
    const ok = await setWorkerSecret(env, w, key_name, minted.value);
    results.push({ worker: w, updated: ok });
  }
  await sendTelegram(env, `🔄 *Rotated* \`${provider}:${key_name}\` — pushed to ${results.filter(r => r.updated).length}/${results.length} workers.`);
  return { ok: true, provider, key_name, minted_id: minted.id, updated_workers: results };
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: WORKER, version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);
    if (path === '/rotate' && request.method === 'POST') {
      try {
        const body = await request.json();
        if (!body.provider || !body.key_name) return err('provider and key_name required');
        return json(await rotate(env, body));
      } catch (e) { return err('rotate failed: ' + e.message, 500); }
    }
    if (path === '/report' && request.method === 'GET') {
      return json({ ok: true, worker: WORKER, version: VERSION });
    }
    return err('Not found', 404);
  },
};