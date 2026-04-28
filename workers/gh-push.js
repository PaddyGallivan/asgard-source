// gh-push relay — commits a single file to a GitHub repo
// Auth: requires Authorization: Bearer <GH_PUSH_BEARER> header
// Secret bindings required: GITHUB_TOKEN, GH_PUSH_BEARER

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });

    // ── Auth ──────────────────────────────────────────────────────
    const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const expected = env.GH_PUSH_BEARER || '';
    if (!expected) return new Response(JSON.stringify({ error: 'GH_PUSH_BEARER secret not set on worker' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    if (!bearer || bearer !== expected) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });

    // ── Parse body ────────────────────────────────────────────────
    let body;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }); }
    const { owner, repo, path, content, message, branch = 'main' } = body;
    if (!owner || !repo || !path || content === undefined || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: owner, repo, path, content, message' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // ── Get existing file SHA (for updates) ───────────────────────
    const ghBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const ghHeaders = { 'Authorization': `Bearer ${env.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'asgard-gh-push' };
    let sha;
    try {
      const existing = await fetch(`${ghBase}?ref=${branch}`, { headers: ghHeaders });
      if (existing.ok) { const j = await existing.json(); sha = j.sha; }
    } catch {}

    // ── Commit ────────────────────────────────────────────────────
    const payload = { message, content: btoa(unescape(encodeURIComponent(content))), branch };
    if (sha) payload.sha = sha;
    const put = await fetch(ghBase, { method: 'PUT', headers: { ...ghHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await put.json();
    if (!put.ok) return new Response(JSON.stringify({ error: 'GitHub API error', detail: result }), { status: put.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify({ success: true, sha: result.content?.sha || null }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
};
