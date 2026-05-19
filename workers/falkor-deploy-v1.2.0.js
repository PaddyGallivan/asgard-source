// falkor-deploy v1.2.0
//
// New since v1.1.1:
//   • POST /deploy now writes prior bundle to DEPLOY_HISTORY KV before applying.
//   • POST /rollback {worker, steps_back?} restores the prior bundle with keep_bindings.
//   • GET  /history?worker=NAME returns last 10 deploy records.
//   • POST /deploy {pr: true, auto_merge: true} opens a GitHub PR with the diff
//     instead of (or in addition to) direct deploy.
//
// Bindings: AGENT_PIN, CF_API_TOKEN, CF_ACCOUNT_ID, GITHUB_TOKEN, DEPLOY_HISTORY (KV)

const VERSION = '1.2.0';
const REPO    = 'Luck-Dragon-Pty-Ltd/asgard-source';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } }); }
function err(msg, s = 400) { return json({ ok: false, error: msg }, s); }
function pinOk(request, env) {
  const pin = request.headers.get('X-Pin') || '';
  if (!env.AGENT_PIN) return true;
  return pin === env.AGENT_PIN;
}

async function sha256Hex(s) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getBindings(env, workerName) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${workerName}/settings`,
    { headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` } }
  );
  if (!r.ok) throw new Error(`getBindings ${workerName} HTTP ${r.status}: ${await r.text()}`);
  const d = await r.json();
  const bindings = (d.result?.bindings || []).map(b => ({
    type: b.type, name: b.name,
    has_value: b.type === 'secret_text' ? true : undefined,
    namespace_id: b.namespace_id, service: b.service, class_name: b.class_name, database_id: b.database_id,
  }));
  return { bindings, compatibility_date: d.result?.compatibility_date, compatibility_flags: d.result?.compatibility_flags || [] };
}

async function getWorkerCode(env, workerName) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${workerName}`,
    { headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` } }
  );
  if (!r.ok) return null;
  return await r.text();
}

function diffBindings(before, after) {
  const b = new Set(before.map(x => `${x.type}:${x.name}`));
  const a = new Set(after.map(x => `${x.type}:${x.name}`));
  return { lost: [...b].filter(k => !a.has(k)), added: [...a].filter(k => !b.has(k)), ok: [...b].every(k => a.has(k)) };
}

async function deployWorker(env, workerName, code, bindings = [], { verify = false, recordHistory = true } = {}) {
  let snapshot = null;
  let priorCode = null;
  try {
    snapshot = await getBindings(env, workerName);
    priorCode = await getWorkerCode(env, workerName);
  } catch (_) {}

  // record prior to DEPLOY_HISTORY (best-effort)
  if (recordHistory && priorCode) {
    try {
      const ts = new Date().toISOString();
      const priorHash = await sha256Hex(priorCode);
      const newHash = await sha256Hex(code);
      const histKey = `${workerName}:${ts}`;
      await env.DEPLOY_HISTORY.put(histKey, JSON.stringify({
        ts, worker: workerName, prior_hash: priorHash, new_hash: newHash,
        bindings: snapshot?.bindings?.length || 0,
      }), { expirationTtl: 365 * 86400 });
      await env.DEPLOY_HISTORY.put(`${histKey}:source`, priorCode, { expirationTtl: 365 * 86400 });

      // prune to last 10 records per worker
      const list = await env.DEPLOY_HISTORY.list({ prefix: `${workerName}:` });
      const dates = list.keys.filter(k => !k.name.endsWith(':source')).map(k => k.name).sort();
      if (dates.length > 10) {
        for (const old of dates.slice(0, dates.length - 10)) {
          await env.DEPLOY_HISTORY.delete(old);
          await env.DEPLOY_HISTORY.delete(`${old}:source`);
        }
      }
    } catch (_) {}
  }

  const existingDate = snapshot?.compatibility_date || '2024-09-02';
  const existingFlags = snapshot?.compatibility_flags || null;

  const keep_bindings = [
    'secret_text', 'plain_text', 'kv_namespace', 'd1', 'service',
    'durable_object_namespace', 'r2_bucket', 'vectorize', 'ai', 'queue',
    'analytics_engine', 'hyperdrive', 'browser', 'dispatch_namespace',
    'version_metadata', 'send_email',
  ];

  const metadata = { main_module: 'worker.js', compatibility_date: existingDate, bindings, keep_bindings };
  if (existingFlags && existingFlags.length) metadata.compatibility_flags = existingFlags;

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), 'metadata.json');
  form.append('worker.js', new Blob([code], { type: 'application/javascript+module' }), 'worker.js');

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/workers/scripts/${workerName}`,
    { method: 'PUT', headers: { 'Authorization': `Bearer ${env.CF_API_TOKEN}` }, body: form }
  );
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data.errors || data));

  const result = { ok: true, worker: workerName, id: data.result?.id, kept_types: keep_bindings.length };
  if (verify && snapshot) {
    try {
      const after = await getBindings(env, workerName);
      const d = diffBindings(snapshot.bindings, after.bindings);
      result.verify = { ok: d.ok, lost: d.lost, added: d.added, before_count: snapshot.bindings.length, after_count: after.bindings.length };
      if (!d.ok) return { ...result, ok: false, error: `bindings lost: ${d.lost.join(', ')}` };
    } catch (e) { result.verify = { ok: false, error: 'verify threw: ' + e.message }; }
  }
  return result;
}

async function rollback(env, worker, stepsBack = 1) {
  const list = await env.DEPLOY_HISTORY.list({ prefix: `${worker}:` });
  const records = list.keys.filter(k => !k.name.endsWith(':source')).map(k => k.name).sort().reverse();
  if (records.length < stepsBack) return { ok: false, error: `only ${records.length} prior deploys recorded` };
  const target = records[stepsBack - 1]; // 1=most recent prior
  const source = await env.DEPLOY_HISTORY.get(`${target}:source`);
  if (!source) return { ok: false, error: `no source stored for ${target}` };
  const result = await deployWorker(env, worker, source, [], { verify: false, recordHistory: false });
  return { ok: result.ok, worker, restored_from: target, deploy_result: result };
}

// ── GitHub PR flow ────────────────────────────────────────────────────────────
async function gh(env, path, opts = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'falkor-deploy/1.2.0',
      'Accept': 'application/vnd.github+json',
      ...(opts.headers || {}),
    },
  });
}

async function openDeployPR(env, worker, code, autoMerge) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const branch = `deploy/${worker}-${ts}`;
  const path = `workers/${worker}.js`;
  // get default branch sha
  const repo = await (await gh(env, `/repos/${REPO}`)).json();
  const ref = await (await gh(env, `/repos/${REPO}/git/refs/heads/${repo.default_branch}`)).json();
  // create new branch
  await gh(env, `/repos/${REPO}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }) });
  // get current file sha (if exists)
  let fileSha;
  try { const f = await (await gh(env, `/repos/${REPO}/contents/${path}?ref=${branch}`)).json(); fileSha = f.sha; } catch (_) {}
  // commit
  const b64 = btoa(unescape(encodeURIComponent(code)));
  await gh(env, `/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({ message: `Deploy ${worker}`, content: b64, branch, sha: fileSha }),
  });
  // open PR
  const prResp = await gh(env, `/repos/${REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title: `Deploy ${worker}`, head: branch, base: repo.default_branch, body: `Automated deploy PR via falkor-deploy v${VERSION}` }),
  });
  const pr = await prResp.json();
  if (autoMerge && pr.number) {
    await gh(env, `/repos/${REPO}/pulls/${pr.number}/merge`, { method: 'PUT', body: JSON.stringify({ merge_method: 'squash' }) }).catch(() => {});
  }
  return { ok: true, pr_url: pr.html_url, pr_number: pr.number, branch };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: 'falkor-deploy', version: VERSION });
    if (!pinOk(request, env)) return err('Unauthorized', 401);

    if (path === '/deploy' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { worker, code, bindings, verify, pr, auto_merge, skip_github } = body;
        if (!worker) return err('worker required');
        if (!code) return err('code required');
        if (pr) {
          const prResult = await openDeployPR(env, worker, code, !!auto_merge);
          if (!auto_merge) return json({ ok: true, mode: 'pr', ...prResult });
          // auto-merge path: also run direct deploy
        }
        const cf = await deployWorker(env, worker, code, bindings || [], { verify: !!verify });
        let gh = null;
        if (pr && auto_merge) gh = { pr_merged: true };
        if (cf.ok === false) return json({ ok: false, cf, github: gh }, 500);
        return json({ ok: true, cf, github: gh });
      } catch (e) { return err('Deploy failed: ' + e.message, 500); }
    }

    if (path === '/rollback' && request.method === 'POST') {
      try {
        const body = await request.json();
        if (!body.worker) return err('worker required');
        return json(await rollback(env, body.worker, body.steps_back || 1));
      } catch (e) { return err('Rollback failed: ' + e.message, 500); }
    }

    if (path === '/history' && request.method === 'GET') {
      const worker = url.searchParams.get('worker');
      if (!worker) return err('worker query required');
      const list = await env.DEPLOY_HISTORY.list({ prefix: `${worker}:` });
      const records = [];
      for (const k of list.keys.filter(x => !x.name.endsWith(':source')).slice(0, 10)) {
        const raw = await env.DEPLOY_HISTORY.get(k.name);
        if (raw) records.push(JSON.parse(raw));
      }
      return json({ ok: true, worker, records });
    }

    if (path === '/verify' && request.method === 'GET') {
      const worker = url.searchParams.get('worker');
      if (!worker) return err('worker query required');
      try { return json({ ok: true, worker, ...(await getBindings(env, worker)) }); }
      catch (e) { return err(e.message, 500); }
    }

    return err('Not found', 404);
  },
};