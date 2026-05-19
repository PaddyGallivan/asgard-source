// asgard-vault-backup v1.0.0
//
// Nightly snapshot of every key/value in ASGARD_VAULT to R2 bucket
// asgard-vault-backups as a single JSON blob, encrypted with AES-GCM using
// BACKUP_ENCRYPT_KEY (32-byte random). Filename: vault-YYYY-MM-DD.json.enc.
// Keep last 90 days, delete older.
//
// Bindings: AGENT_PIN, ASGARD_VAULT_READ_PIN, BACKUP_ENCRYPT_KEY (secret_text,
//           base64-encoded 32 bytes), ASGARD_BACKUP (R2 binding),
//           TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 17 * * * (3am AEST daily)

const VERSION = '1.0.0';
const WORKER  = 'asgard-vault-backup';
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

function b64decode(s) {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function b64encode(u) {
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

async function importKey(b64Key) {
  const raw = b64decode(b64Key);
  return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptJson(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(obj));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv); out.set(ct, iv.length);
  return out;
}

async function fetchVaultDump(env) {
  const r = await fetch(`${VAULT_URL}/dump`, { headers: { 'X-Pin': env.ASGARD_VAULT_READ_PIN } });
  if (!r.ok) throw new Error(`vault dump HTTP ${r.status}`);
  return await r.json();
}

async function runOnce(env) {
  const date = new Date().toISOString().slice(0, 10);
  const dump = await fetchVaultDump(env);
  const key = await importKey(env.BACKUP_ENCRYPT_KEY);
  const encrypted = await encryptJson({ ts: new Date().toISOString(), dump }, key);
  const filename = `vault-${date}.json.enc`;
  await env.ASGARD_BACKUP.put(filename, encrypted, {
    customMetadata: { ts: new Date().toISOString(), key_count: String(Object.keys(dump.secrets || dump).length) },
  });

  // Prune >90 days
  const list = await env.ASGARD_BACKUP.list({ prefix: 'vault-' });
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const deleted = [];
  for (const obj of list.objects) {
    const m = obj.key.match(/vault-(\d{4}-\d{2}-\d{2})\.json\.enc/);
    if (m && m[1] < cutoff) {
      await env.ASGARD_BACKUP.delete(obj.key);
      deleted.push(obj.key);
    }
  }

  return { ok: true, ts: new Date().toISOString(), filename, size: encrypted.length, deleted };
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: WORKER, version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);
    if (path === '/run' && request.method === 'POST') {
      try {
        const r = await runOnce(env);
        await sendTelegram(env, `💾 Vault backup OK — \`${r.filename}\` (${r.size} bytes)${r.deleted.length ? `\nPruned ${r.deleted.length} >90d backups` : ''}`);
        return json(r);
      } catch (e) { return err('backup failed: ' + e.message, 500); }
    }
    if (path === '/report' && request.method === 'GET') {
      const list = await env.ASGARD_BACKUP.list({ prefix: 'vault-' });
      return json({ ok: true, count: list.objects.length, recent: list.objects.slice(-7).map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded })) });
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try {
      const r = await runOnce(env);
      // Only telegram on first day or on prune events — quiet on steady-state success
      if (r.deleted.length) await sendTelegram(env, `💾 Vault backup ${r.filename} OK; pruned ${r.deleted.length} old`);
    } catch (e) {
      await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`);
      throw e;
    }
  },
};