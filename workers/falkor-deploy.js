// falkor-deploy v1.0.0 — Cowork deploy bridge
// A lightweight worker that lets the Cowork sandbox deploy other workers.
// Auth: X-Pin: AGENT_PIN (same as all other falkor workers)
// Endpoints:
//   POST /deploy        — deploy worker code to CF + optionally push to GitHub
//   POST /github/push   — push a file to GitHub only
//   GET  /health        — version check
//
// Bindings needed: AGENT_PIN (secret), CF_API_TOKEN (secret), CF_ACCOUNT_ID (secret), GITHUB_TOKEN (secret)

const VERSION = '1.0.0';
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

// ── Deploy worker to Cloudflare ───────────────────────────────────────────────
async function deployWorker(env, workerName, code, bindings = []) {
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_API_TOKEN;
  if (!accountId || !token) throw new Error('CF_ACCOUNT_ID or CF_API_TOKEN missing');

  const metadata = {
    main_module: 'worker.js',
    compatibility_date: '2024-09-02',
    bindings,
  };

  const form = new FormData();
  form.append('metadata', JSON.stringify(metadata), { filename: 'metadata.json', contentType: 'application/json' });
  form.append('worker.js', code, { filename: 'worker.js', contentType: 'application/javascript+module' });

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerName}`,
    {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    }
  );
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors || data));
  return { ok: true, worker: workerName, id: data.result?.id };
}

// ── Push file to GitHub ───────────────────────────────────────────────────────
async function githubPush(env, path, content, message, sha) {
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN missing');
  const b64 = btoa(unescape(encodeURIComponent(content)));
  const body = { message, content: b64 };
  if (sha) body.sha = sha;
  const resp = await fetch(
    `https://api.github.com/repos/LuckDragonAsgard/asgard-source/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'falkor-deploy/1.0',
      },
      body: JSON.stringify(body),
    }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || JSON.stringify(data));
  return { ok: true, sha: data.content?.sha };
}

// ── Get current file SHA from GitHub ─────────────────────────────────────────
async function githubGetSha(env, path) {
  const token = env.GITHUB_TOKEN;
  const resp = await fetch(
    `https://api.github.com/repos/LuckDragonAsgard/asgard-source/contents/${path}`,
    { headers: { 'Authorization': `token ${token}`, 'User-Agent': 'falkor-deploy/1.0' } }
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.sha || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: 'falkor-deploy', version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);

    // ── POST /deploy — deploy worker to CF + push to GitHub ──────────────────
    if (path === '/deploy' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { worker, code, github_path, commit_message, bindings, skip_github } = body;
        if (!worker) return err('worker name required');
        if (!code) return err('code required');

        // 1. Deploy to CF
        const cfResult = await deployWorker(env, worker, code, bindings || []);

        // 2. Push to GitHub (unless skip_github)
        let ghResult = null;
        if (!skip_github && github_path) {
          const sha = await githubGetSha(env, github_path);
          ghResult = await githubPush(
            env,
            github_path,
            code,
            commit_message || `Deploy ${worker} via falkor-deploy`,
            sha
          );
        }

        return json({ ok: true, cf: cfResult, github: ghResult });
      } catch (e) {
        return err('Deploy failed: ' + e.message, 500);
      }
    }

    // ── POST /github/push — push file to GitHub only ─────────────────────────
    if (path === '/github/push' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { path: filePath, content, message } = body;
        if (!filePath || !content) return err('path and content required');
        const sha = await githubGetSha(env, filePath);
        const result = await githubPush(env, filePath, content, message || 'Update via falkor-deploy', sha);
        return json(result);
      } catch (e) {
        return err('GitHub push failed: ' + e.message, 500);
      }
    }

    return err('Not found', 404);
  },
};
