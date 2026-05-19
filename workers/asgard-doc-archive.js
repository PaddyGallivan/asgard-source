// asgard-doc-archive v1.0.0
//
// Weekly cron: in the Luck-Dragon-Pty-Ltd/asgard-source repo, move any
// root-level *.md older than 14 days into archive/<YYYY-MM>/. Regenerate
// CURRENT-STATE.md as a fresh index.
//
// (Operates on GitHub mirror only — Paddy's local OneDrive folder is
//  out of scope. See Asgard CLI #17 for local archive.)
//
// Bindings: AGENT_PIN, GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_QUIET
// Cron:     0 21 * * 0 (7am AEST Sunday)

const VERSION = '1.0.0';
const WORKER  = 'asgard-doc-archive';
const REPO    = 'Luck-Dragon-Pty-Ltd/asgard-source';
const ARCHIVE_DAYS = 14;

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

async function gh(env, path, opts = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': WORKER,
      'Accept': 'application/vnd.github+json',
      ...(opts.headers || {}),
    },
  });
  return r;
}

async function listRootMd(env) {
  const r = await gh(env, `/repos/${REPO}/contents/`);
  const d = await r.json();
  return d.filter(f => f.type === 'file' && f.name.endsWith('.md'));
}

async function lastCommitDate(env, path) {
  const r = await gh(env, `/repos/${REPO}/commits?path=${encodeURIComponent(path)}&per_page=1`);
  const d = await r.json();
  return d[0]?.commit?.author?.date;
}

async function readFile(env, path) {
  const r = await gh(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}`);
  const d = await r.json();
  return { sha: d.sha, content: atob(d.content.replace(/\n/g, '')) };
}

async function writeFile(env, path, content, message, sha) {
  const b64 = btoa(unescape(encodeURIComponent(content)));
  const body = { message, content: b64 };
  if (sha) body.sha = sha;
  return gh(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}`, { method: 'PUT', body: JSON.stringify(body) });
}

async function deleteFile(env, path, sha, message) {
  return gh(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha }),
  });
}

async function runOnce(env) {
  const cutoff = Date.now() - ARCHIVE_DAYS * 86400000;
  const files = await listRootMd(env);
  const moved = [];

  for (const f of files) {
    if (f.name === 'README.md' || f.name === 'CURRENT-STATE.md' || f.name === 'CONVENTIONS.md' || f.name === 'IMPROVEMENTS-PLAN.md') continue;
    const dateStr = await lastCommitDate(env, f.path);
    if (!dateStr) continue;
    if (new Date(dateStr).getTime() >= cutoff) continue;
    const yyyymm = dateStr.slice(0, 7);
    const archivePath = `archive/${yyyymm}/${f.name}`;
    const { sha, content } = await readFile(env, f.path);
    await writeFile(env, archivePath, content, `Archive ${f.name}`);
    await deleteFile(env, f.path, sha, `Move ${f.name} to ${archivePath}`);
    moved.push({ from: f.name, to: archivePath });
  }

  // Rebuild CURRENT-STATE.md index
  const stillRoot = (await listRootMd(env)).map(f => `- [${f.name}](${f.path})`).join('\n');
  const indexBody = `# Current state — ${new Date().toISOString().slice(0, 10)}\n\nRoot-level markdown:\n\n${stillRoot}\n\nLast updated by ${WORKER} v${VERSION}.\n`;
  let indexSha;
  try { indexSha = (await readFile(env, 'CURRENT-STATE.md')).sha; } catch (_) {}
  await writeFile(env, 'CURRENT-STATE.md', indexBody, 'Regenerate CURRENT-STATE.md', indexSha);

  return { ok: true, ts: new Date().toISOString(), moved, count: moved.length };
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
        if (r.count) await sendTelegram(env, `🗂 Archived ${r.count} doc${r.count === 1 ? '' : 's'} from ${REPO} root.`);
        return json(r);
      } catch (e) { return err('archive failed: ' + e.message, 500); }
    }
    return err('Not found', 404);
  },
  async scheduled(event, env, ctx) {
    try {
      const r = await runOnce(env);
      if (r.count) await sendTelegram(env, `🗂 Weekly archive — ${r.count} doc${r.count === 1 ? '' : 's'} moved.`);
    } catch (e) { await sendTelegram(env, `🚨 ${WORKER} cron exception: ${e.message}`); throw e; }
  },
};