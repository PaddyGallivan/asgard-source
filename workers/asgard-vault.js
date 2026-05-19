// asgard-vault v1.5.0 — STRICT: only VAULT_PIN_PRIMARY accepted (legacy 535554 rotation 2026-05-06) + KV fallback
const requirePin = async (request, env) => {
  const pin = request.headers.get('X-Pin') || request.headers.get('X-PIN');
  
  // Self-healing: fallback to KV if CF secret is missing
  const effectivePin = env.VAULT_PIN_PRIMARY || await env.VAULT.get('VAULT_PIN_PRIMARY_KV') || '';
  
  if (!pin || !effectivePin) return false;
  // constant-time compare
  if (pin.length !== effectivePin.length) return false;
  let diff = 0;
  for (let i = 0; i < pin.length; i++) diff |= pin.charCodeAt(i) ^ effectivePin.charCodeAt(i);
  return diff === 0;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Pin,X-PIN,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', ...corsHeaders }
});

const unauthorized = () => json({ ok: false, error: 'Unauthorized — X-Pin required' }, 401);

async function sha256Hex(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function auditLog(env, op, key, request) {
  if (!env.ASGARD_VAULT_AUDIT) return;
  const ts = new Date().toISOString();
  const entry = {
    ts, op, key,
    pin_hash: await sha256Hex((request.headers.get('X-Pin') || request.headers.get('X-PIN') || '').slice(0, 4) + ts.slice(0, 10)),
    ip: request.headers.get('CF-Connecting-IP') || '',
    ua: (request.headers.get('User-Agent') || '').slice(0, 80),
  };
  await env.ASGARD_VAULT_AUDIT.put(ts + ':' + op + ':' + key, JSON.stringify(entry), { expirationTtl: 90 * 86400 });
}


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    if (url.pathname === '/health') {
      const keys = await env.VAULT.list();
      return json({ ok: true, worker: 'asgard-vault', version: '1.5.0', secrets: keys.keys.length, ts: new Date() });
    }

    if (!await requirePin(request, env)) return unauthorized();

    if (url.pathname.startsWith('/secret/') && request.method === 'GET') {
      const key = url.pathname.replace('/secret/', '');
      if (!key) return json({ error: 'key required' }, 400);
      const value = await env.VAULT.get(key);
      if (value === null) return json({ error: 'Secret not found: ' + key }, 404);
      ctx.waitUntil(auditLog(env, 'read', key, request));
      return new Response(value, { headers: { 'Content-Type': 'text/plain', ...corsHeaders } });
    }

    if (url.pathname.startsWith('/secret/') && request.method === 'PUT') {
      const key = url.pathname.replace('/secret/', '');
      if (!key) return json({ error: 'key required' }, 400);
      const body = await request.text();
      if (!body) return json({ error: 'value required' }, 400);
      let value = body;
      try { const j = JSON.parse(body); if (j.value !== undefined) value = j.value; } catch (e) {}
      ctx.waitUntil(auditLog(env, 'write', key, request));
      await env.VAULT.put(key, value);
      return json({ ok: true, key });
    }

    if (url.pathname.startsWith('/secret/') && request.method === 'DELETE') {
      const key = url.pathname.replace('/secret/', '');
      ctx.waitUntil(auditLog(env, 'delete', key, request));
      await env.VAULT.delete(key);
      return json({ ok: true, deleted: key });
    }

    if (url.pathname === '/secrets' && request.method === 'GET') {
      const list = await env.VAULT.list();
      return json({ keys: list.keys.map(k => k.name) });
    }

    if (url.pathname === '/secret' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !body.key || !body.value) return json({ error: 'key and value required' }, 400);
      await env.VAULT.put(body.key, body.value);
      return json({ ok: true, key: body.key });
    }


    if (url.pathname === '/audit/list' && request.method === 'GET') {
      if (!env.ASGARD_VAULT_AUDIT) return json({ ok: false, error: 'ASGARD_VAULT_AUDIT not bound' }, 503);
      const since = url.searchParams.get('since') || new Date(Date.now() - 86400000).toISOString();
      const list = await env.ASGARD_VAULT_AUDIT.list({ prefix: '' });
      const entries = [];
      for (const k of list.keys) {
        if (k.name < since) continue;
        const raw = await env.ASGARD_VAULT_AUDIT.get(k.name);
        if (raw) entries.push(JSON.parse(raw));
      }
      return json({ ok: true, count: entries.length, entries: entries.slice(0, 100) });
    }

    return json({
      ok: true, worker: 'asgard-vault', version: '1.5.0',
      endpoints: ['/health (public)', '/secret/KEY (PIN)', '/secrets (PIN)']
    });
  }
};