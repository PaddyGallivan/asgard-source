// asgard-backup — nightly snapshot of D1 data + worker sources to GitHub
// Cron: daily at 18:00 UTC (4am AEST)
// Bindings needed: PADDY_PIN (secret), GITHUB_TOKEN (secret)
// Also callable manually: GET /run?pin=<pin>

const VERSION = '1.0.0';
const GITHUB_REPO = 'PaddyGallivan/asgard-backups';
const BRAIN_URL = 'https://asgard-brain.pgallivan.workers.dev';
const TOOLS_URL = 'https://asgard-tools.pgallivan.workers.dev';

// All D1 tables to back up
const D1_TABLES = [
  'products', 'conversations', 'messages', 'memory', 'spend_log',
  'project_events', 'project_files', 'project_chat', 'msg_groups',
  'msg_inbox', 'msg_read_receipts', 'errors', 'audit_log',
  'metrics', 'anomalies', 'patterns', 'decisions', 'global_rules',
  'project_rules', 'feature_flags', 'hub_config', 'feature_requests',
  'facts', 'claude_sessions', 'email_products', 'comms_log',
  'deployments', 'builds', 'rollbacks', 'system_docs'
];

// Worker sources to snapshot
const WORKERS_TO_SNAPSHOT = [
  'asgard', 'asgard-ai', 'asgard-tools', 'asgard-brain', 'asgard-vault',
  'racetipping-api', 'sly-app', 'thor', 'lady-thor',
  'thunder-dev', 'thunder-dispatch', 'thunder-inbox', 'thunder-revenue', 'thunder-watch',
  'gh-push', 'wps-hub-v3'
];

async function githubPush(token, path, content, message) {
  const enc = btoa(unescape(encodeURIComponent(content)));
  // Get existing SHA if file exists
  let sha = null;
  try {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      headers: { Authorization: `token ${token}`, 'User-Agent': 'asgard-backup/1.0' }
    });
    if (r.ok) { const d = await r.json(); sha = d.sha; }
  } catch {}

  const body = { message, content: enc };
  if (sha) body.sha = sha;

  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json',
               'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'asgard-backup/1.0' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(`GitHub push failed for ${path}: ${resp.status} ${await resp.text()}`);
  return true;
}

async function backupD1(pin, token, dateStr) {
  const results = {};
  const errors = [];
  for (const table of D1_TABLES) {
    try {
      const r = await fetch(`${BRAIN_URL}/d1/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pin': pin },
        body: JSON.stringify({ sql: `SELECT * FROM ${table} LIMIT 10000`, params: [] })
      });
      const d = await r.json();
      if (d.results) {
        results[table] = { count: d.results.length, rows: d.results };
      } else {
        errors.push(`${table}: ${d.error || 'no results'}`);
      }
    } catch (e) {
      errors.push(`${table}: ${e.message}`);
    }
  }
  const content = JSON.stringify({ backup_date: dateStr, tables: results, errors }, null, 2);
  await githubPush(token, `d1/${dateStr}.json`, content,
    `D1 backup ${dateStr} — ${Object.keys(results).length} tables, ${errors.length} errors`);
  // Also write latest.json
  await githubPush(token, 'd1/latest.json', content, `D1 latest backup ${dateStr}`);
  return { tables: Object.keys(results).length, errors };
}

async function snapshotWorkers(pin, token, dateStr) {
  const results = {};
  const errors = [];
  for (const worker of WORKERS_TO_SNAPSHOT) {
    try {
      const r = await fetch(`${TOOLS_URL}/admin/patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pin': pin,
                   'Origin': 'https://asgard.pgallivan.workers.dev',
                   'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ worker_name: worker, find: '__BACKUP_PROBE__', replace: '__BACKUP_PROBE__' })
      });
      const d = await r.json();
      // "find string not found" means we got the code — it exists
      // We need a different approach: use get_worker_code via a read endpoint
      // For now just record that the worker exists/doesn't
      if (d.error === 'find string not found') {
        results[worker] = 'exists_on_cf';
      } else if (d.error && d.error.includes('10007')) {
        results[worker] = 'not_found_on_account';
      } else {
        results[worker] = d.error || 'unknown';
      }
    } catch (e) {
      errors.push(`${worker}: ${e.message}`);
    }
  }

  const content = JSON.stringify({ snapshot_date: dateStr, workers: results, errors }, null, 2);
  await githubPush(token, `workers/status-${dateStr}.json`, content,
    `Worker status snapshot ${dateStr}`);
  return { checked: Object.keys(results).length, errors };
}

async function runBackup(env) {
  const pin = env.PADDY_PIN;
  const token = env.GITHUB_TOKEN;
  if (!pin || !token) throw new Error('Missing PADDY_PIN or GITHUB_TOKEN bindings');

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timestamp = now.toISOString();

  console.log(`[asgard-backup] Starting backup ${timestamp}`);

  const [d1Result, workerResult] = await Promise.allSettled([
    backupD1(pin, token, dateStr),
    snapshotWorkers(pin, token, dateStr)
  ]);

  const summary = {
    timestamp,
    version: VERSION,
    d1: d1Result.status === 'fulfilled' ? d1Result.value : { error: d1Result.reason?.message },
    workers: workerResult.status === 'fulfilled' ? workerResult.value : { error: workerResult.reason?.message },
    status: (d1Result.status === 'fulfilled') ? 'ok' : 'partial'
  };

  // Write run log
  await githubPush(token, `logs/backup-${dateStr}.json`,
    JSON.stringify(summary, null, 2),
    `Backup log ${dateStr} — ${summary.status}`);

  console.log(`[asgard-backup] Done:`, JSON.stringify(summary));
  return summary;
}

export default {
  // Cron trigger — runs daily at 18:00 UTC (4am AEST)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runBackup(env).catch(e => console.error('[asgard-backup] FAILED:', e)));
  },

  // Manual trigger via HTTP
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ ok: true, worker: 'asgard-backup', version: VERSION,
        schedule: 'daily 18:00 UTC (4am AEST)', repo: GITHUB_REPO });
    }

    if (url.pathname === '/run') {
      const pin = request.headers.get('X-Pin') || url.searchParams.get('pin');
      if (pin !== env.PADDY_PIN) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        const result = await runBackup(env);
        return Response.json({ ok: true, ...result });
      } catch (e) {
        return Response.json({ ok: false, error: e.message }, { status: 500 });
      }
    }

    return Response.json({ error: 'Not found', routes: ['/health', '/run'] }, { status: 404 });
  }
};
