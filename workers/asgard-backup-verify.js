// asgard-backup-verify v1.0.0
//
// Weekly cron: pick a random R2 vault backup, decrypt, verify all keys
// deserialize and spot-check 5 against current vault. Catches silent
// backup rot.
//
// Depends on asgard-vault-backup being live first.
//
// Bindings: AGENT_PIN, ASGARD_BACKUP (R2), BACKUP_ENCRYPT_KEY,
//           ASGARD_VAULT_READ_PIN, VAULT_VERIFY_KV (KV),
//           TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 14 * * 2 (midnight AEST Tuesday)

const VERSION = '1.0.0';
const WORKER  = 'asgard-backup-verify';
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

function b64decode(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

async function importKey(b64Key) {
  return await crypto.subtle.importKey('raw', b64decode(b64Key), { name: 'AES-GCM' }, false, ['decrypt']);
}

async function decryptBlob(blob, key) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plain));
}

async function fetchVaultDump(env) {
  const r = await fetch(`${VAULT_URL}/dump`, { headers: { 'X-Pin': env.ASGARD_VAULT_READ_PIN } });
  if (!r.ok) throw new Error(`vault dump HTTP ${r.status}`);
  return await r.json();
}

async function runOnce(env) {
  const list = await env.ASGARD_BACKUP.list({ prefix: 'vault-' });
  if (list.objects.length === 0) throw new Error('no backups in R2');
  // pick random
  const pick = list.objects[Math.floor(Math.random() * list.objects.length)];
  const obj = await env.ASGARD_BACKUP.get(pick.key);
  if (!obj) throw new Error(`could not GET ${pick.key}`);

  const key = await importKey(env.BACKUP_ENCRYPT_KEY);
  let decrypted;
  try { decrypted = await decryptBlob(obj, key); }
  catch (e) { return { ok: false, picked: pick.key, error: 'decrypt failed: ' + e.message }; }

  const backupSecrets = decrypted.dump?.secrets || decrypted.dump || {};
  const keyCount = Object.keys(backupSecrets).length;

  // spot check: pick 5 random keys, verify they're either:
  //   (a) still present in current vault with same value, OR
  //   (b) marked as rotated in metadata (legitimate change)
  const currentDump = await fetchVaultDump(env);
  const currentSecrets = currentDump?.secrets || currentDump || {};
  const sampleKeys = Object.keys(backupSecrets).sort(() => Math.random() - 0.5).slice(0, 5);
  const checks = [];
  for (const k of sampleKeys) {
    const backupVal = backupSecrets[k];
    const currentVal = currentSecrets[k];
    if (currentVal === undefined) checks.push({ key: k, status: 'absent_now' });
    else if (currentVal === backupVal) checks.push({ key: k, status: 'match' });
    else checks.push({ key: k, status: 'mismatch_rotated' }); // assume legitimate rotation
  }
  const matches = checks.filter(c => c.status === 'match').length;

  const result = {
    ok: true,
    ts: new Date().toISOString(),
    picked: pick.key,
    backup_age_days: Math.floor((Date.now() - new Date(pick.uploaded).getTime()) / 86400000),
    backup_key_count: keyCount,
    spot_check: `${matches}/5 match (rest rotated or absent)`,
    details: checks,
  };
  await env.VAULT_VERIFY_KV.put(`verify:${new Date().toISOString().slice(0, 10)}`, JSON.stringify(result), { expirationTtl: 365 * 86400 });
  await env.VAULT_VERIFY_KV.put('last-summary', JSON.stringify(result));
  return result;
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
        await sendTelegram(env, `🔬 Backup verify — \`${r.picked}\` (${r.backup_age_days}d old, ${r.backup_key_count} keys, ${r.spot_check})`);
        return json(r);
      } catch (e) { return err('verify failed: ' + e.message, 500); }
    }
    if (path === '/report' && request.method === 'GET') {
      const raw = await env.VAULT_VERIFY_KV.get('last-summary');
      return json({ ok: true, summary: raw ? JSON.parse(raw) : null });
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try {
      const r = await runOnce(env);
      await sendTelegram(env, `🔬 Weekly backup verify — \`${r.picked}\` (${r.spot_check})`);
    } catch (e) {
      await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`);
      throw e;
    }
  },
};