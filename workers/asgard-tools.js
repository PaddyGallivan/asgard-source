// asgard-tools v1.4.3
// Agentic tool-calling worker — gives Claude in Asgard real infrastructure access
// v1.4.3: remove llm_debug field; AGENT_PIN now consistent across all sub-calls
// Deploy as worker script name: asgard-tools
// Required bindings: CF_API_TOKEN (secret, optional — falls back to vault)

const VERSION = '1.5.6';
const ACCOUNT_ID = 'a6f47c17811ee2f8b6caeb8f38768c20';

const SYSTEM_PROMPT = `You are Asgard, Luck Dragon's infrastructure AI. You have REAL tools — when Paddy asks you to change something, you actually do it. Don't describe what to do; do it.

## Your tools

- **http_request** — call any URL. Use for: gh-push worker (deploy GitHub/CF Pages), asgard-brain (SQL), craftsman (build workers), Stripe API, Supabase REST, CF API, etc.
- **get_worker_code** — read current source of any CF Worker by name
- **deploy_worker** — deploy a new version of any CF Worker (secrets preserved automatically)
- **get_secret** — read a secret from the Asgard vault

## Key endpoints

| What | How |
|------|-----|
| Run SQL (write) | POST https://asgard-brain.pgallivan.workers.dev/d1/write — header X-Pin: {pin}, body {sql, params} |
| Run SQL (read) | POST https://asgard-brain.pgallivan.workers.dev/d1/query — header X-Pin: {pin}, body {sql, params} |
| Push to GitHub (auto-deploys CF Pages) | PUT https://api.github.com/repos/{owner}/{repo}/contents/{path} — Authorization: Bearer {GITHUB_TOKEN env} — body JSON {message, content (base64), branch:"main", sha:"<current sha if UPDATING existing file>"}. To UPDATE: first GET /contents/{path}?ref=main for current sha, then PUT with sha. To CREATE: omit sha. Returns 201 (created) or 200 (updated). |
| (deprecated) gh-push worker | https://gh-push.pgallivan.workers.dev returns CF 1042 — DO NOT use. |
| Build/deploy via Craftsman | POST https://craftsman.pgallivan.workers.dev/api/build — body {worker_name, task, context} |
| Vault read | GET https://asgard-vault.pgallivan.workers.dev/secret/{KEY} — header X-Pin: {pin} |
| CF API | https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/... — header Authorization: Bearer {CF_API_TOKEN} |

## Key facts
- CF Account ID: ${ACCOUNT_ID}
- Paddy's PIN: use get_secret("PADDY_PIN") if you need it, or pass 2967 for X-Pin headers
- All repos are under LuckDragonAsgard org on GitHub
- Bomber Boat API worker: bomber-boat-api | Bomber Boat Pages project: bomber-boat
- Asgard dashboard worker: asgard (main_module: asgard.js)
- gh-push base64 encodes file content — use btoa() or encode manually

## Workflow patterns

**Modify a CF Worker:**
1. get_worker_code(worker_name) — read current code
2. Plan your changes
3. deploy_worker(worker_name, updatedCode) — deploy

**Update a website (CF Pages via GitHub):**
1. Read current file if needed (http_request to raw.githubusercontent.com or get_worker_code)
2. Prepare new file content
3. http_request to gh-push with base64-encoded content
4. CF Pages auto-deploys on push

**Database change:**
1. http_request to asgard-brain /d1/write with SQL

Always confirm what you did — worker deployed, URL live, SQL executed etc. If something fails, diagnose and retry.`;

const TOOLS = [
  {
    name: 'http_request',
    description: 'Make an HTTP request to any URL. Use this to call Asgard workers (gh-push, asgard-brain, craftsman), Cloudflare API, GitHub API, Stripe, Supabase, or any other service. For JSON APIs pass Content-Type: application/json and a JSON-stringified body.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL to request' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], default: 'GET' },
        headers: {
          type: 'object',
          description: 'HTTP headers as string key-value pairs',
          additionalProperties: { type: 'string' }
        },
        body: { type: 'string', description: 'Request body — for JSON APIs, JSON.stringify the object first' }
      },
      required: ['url']
    }
  },
  {
    name: 'get_worker_code',
    description: 'Get the current JavaScript source code of a Cloudflare Worker by script name. Returns the raw JS.',
    input_schema: {
      type: 'object',
      properties: {
        worker_name: { type: 'string', description: 'CF Worker script name, e.g. "asgard", "bomber-boat-api", "gh-push"' }
      },
      required: ['worker_name']
    }
  },
  {
    name: 'deploy_worker',
    description: 'Deploy a new version of a Cloudflare Worker. Provide the complete updated JavaScript source. All existing secret bindings are preserved automatically — you only need to set non-secret bindings if they changed.',
    input_schema: {
      type: 'object',
      properties: {
        worker_name: { type: 'string', description: 'CF Worker script name to deploy to' },
        code: { type: 'string', description: 'Complete JavaScript source (ES module with export default { async fetch(request, env) {...} })' },
        main_module: { type: 'string', description: 'Filename for the main module. Use "asgard.js" for the asgard worker, "worker.js" for everything else. Default: worker.js' }
      },
      required: ['worker_name', 'code']
    }
  },
  {
    name: 'get_secret',
    description: 'Read a secret value from the Asgard vault. Use for API keys, tokens, passwords.',
    input_schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Secret key name, e.g. "CF_API_TOKEN", "GITHUB_TOKEN", "STRIPE_SECRET_KEY", "ANTHROPIC_API_KEY", "PADDY_PIN"' }
      },
      required: ['key']
    }
  }
];

async function getPin(env) {
  return env.PADDY_PIN || '2967';
}

async function getFromVault(key, pin) {
  const r = await fetch(`https://asgard-vault.pgallivan.workers.dev/secret/${key}`, {
    headers: { 'X-Pin': pin }
  });
  if (!r.ok) throw new Error(`Vault ${r.status} for ${key}`);
  return r.text();
}

async function getCfToken(env) {
  if (env.CF_API_TOKEN) return env.CF_API_TOKEN;
  const pin = await getPin(env);
  return getFromVault('CF_API_TOKEN', pin);
}

async function getAnthropicKey(env) {
  if (env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY;
  const pin = await getPin(env);
  return getFromVault('ANTHROPIC_API_KEY', pin);
}

async function executeTool(toolName, toolInput, env) {
  const pin = await getPin(env);

  try {
    switch (toolName) {

      case 'http_request': {
        const { url, method = 'GET', headers = {}, body } = toolInput;
        const opts = { method, headers };
        if (body !== undefined && body !== null) opts.body = body;
        const res = await fetch(url, opts);
        const text = await res.text();
        return { status: res.status, ok: res.ok, body: text.substring(0, 20000) };
      }

      case 'get_worker_code': {
        const { worker_name, main_module } = toolInput;
        const cfToken = await getCfToken(env);
        const r = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}`,
          { headers: { 'Authorization': `Bearer ${cfToken}` } }
        );
        if (!r.ok) {
          return { error: `CF API ${r.status}`, detail: (await r.text()).substring(0, 500) };
        }
        const ct = r.headers.get('Content-Type') || '';
        const text = await r.text();

        // Classic (non-module) worker: raw JS body
        if (ct.startsWith('application/javascript') && !ct.includes('multipart')) {
          return { code: text.substring(0, 500000), length: text.length, format: 'classic' };
        }

        // Module worker: multipart/form-data — extract the JS part by boundary + Content-Disposition
        const boundaryMatch = ct.match(/boundary=([^;]+)/);
        if (!boundaryMatch) {
          return { error: 'No boundary in CF response Content-Type', ct, raw_preview: text.substring(0, 800) };
        }
        const boundary = boundaryMatch[1].trim().replace(/^"|"$/g, '');
        const delim = '--' + boundary;
        const parts = text.split(delim).slice(1, -1); // drop preamble + closing

        const candidates = [];
        for (const raw of parts) {
          let p = raw.replace(/^\r?\n/, '');
          let sepIdx = p.indexOf('\r\n\r\n');
          let sepLen = 4;
          if (sepIdx === -1) { sepIdx = p.indexOf('\n\n'); sepLen = 2; }
          if (sepIdx === -1) continue;
          const headers = p.substring(0, sepIdx);
          let body = p.substring(sepIdx + sepLen);
          // Strip trailing CRLF before next boundary
          body = body.replace(/\r?\n$/, '');
          const fn = headers.match(/filename="([^"]+)"/);
          const nm = headers.match(/name="([^"]+)"/);
          const filename = fn ? fn[1] : (nm ? nm[1] : '');
          candidates.push({ filename, headers, body });
        }

        // Prefer main_module match, else the first .js/.mjs part, else the first non-metadata part
        const wantMain = main_module || 'worker.js';
        let pick = candidates.find(c => c.filename === wantMain)
                || candidates.find(c => /\.m?js$/i.test(c.filename))
                || candidates.find(c => c.filename && c.filename !== 'metadata');

        if (!pick) {
          return {
            error: 'No JS part found in multipart response',
            ct,
            parts_count: candidates.length,
            filenames: candidates.map(c => c.filename),
            raw_preview: text.substring(0, 800)
          };
        }
        return {
          code: pick.body.substring(0, 500000),
          length: pick.body.length,
          format: 'module',
          part_name: pick.filename
        };
      }

      case 'deploy_worker': {
        const { worker_name, main_module = 'worker.js', format, compatibility_flags, compatibility_date } = toolInput;
        let code = toolInput.code;
        const cfToken = await getCfToken(env);

        // Auto-detect classic service worker vs module worker if format not provided
        const isClassic = (format === 'classic') ||
          (!format && /addEventListener\s*\(\s*['"]fetch['"]/.test(code) && !/export\s+default\s*\{/.test(code));

        // v6.18.5: Auto-bump VERSION constant on every deploy (patch increment)
        let codeWithBumpedVersion = code;
        try {
          const _vRe = /const\s+VERSION\s*=\s*['"](\d+)\.(\d+)\.(\d+)['"]/;
          const _vMatch = code.match(_vRe);
          if (_vMatch) {
            const _major = parseInt(_vMatch[1], 10);
            const _minor = parseInt(_vMatch[2], 10);
            const _patch = parseInt(_vMatch[3], 10);
            const _newV = _major + '.' + _minor + '.' + (_patch + 1);
            codeWithBumpedVersion = code.replace(_vRe, "const VERSION = '" + _newV + "'");
            console.log('[deploy] auto-bumped ' + worker_name + ' VERSION: ' + _vMatch[1]+'.'+_vMatch[2]+'.'+_vMatch[3] + ' -> ' + _newV);
          }
        } catch (e) { /* skip if regex fails */ }
        code = codeWithBumpedVersion;

        // Preserve existing compat flags + date if caller did not override
        let _existingFlags = null, _existingDate = null;
        try {
          const _settingsRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}/settings`,
            { headers: { 'Authorization': `Bearer ${cfToken}` } }
          );
          if (_settingsRes.ok) {
            const _s = await _settingsRes.json();
            _existingFlags = _s?.result?.compatibility_flags || null;
            _existingDate = _s?.result?.compatibility_date || null;
          }
        } catch {}
        const _finalFlags = Array.isArray(compatibility_flags) ? compatibility_flags : _existingFlags;
        const _finalDate = compatibility_date || _existingDate || '2024-01-01';
        const _finalFlagsList = (Array.isArray(_finalFlags) && _finalFlags.length > 0) ? _finalFlags : ['nodejs_compat'];
        const _baseKeep = ['secret_text', 'plain_text', 'kv_namespace', 'd1', 'service', 'durable_object_namespace', 'r2_bucket', 'vectorize', 'ai', 'queue', 'analytics_engine', 'hyperdrive', 'browser', 'dispatch_namespace', 'version_metadata', 'send_email'];
        const _metaObj = isClassic
          ? { body_part: main_module, keep_bindings: _baseKeep }
          : { main_module, keep_bindings: _baseKeep };
        if (_finalFlagsList && _finalFlagsList.length) _metaObj.compatibility_flags = _finalFlagsList;
        if (_finalDate) _metaObj.compatibility_date = _finalDate;
        const metadata = JSON.stringify(_metaObj);

        const contentType = isClassic ? 'application/javascript' : 'application/javascript+module';

        const CRLF = String.fromCharCode(13, 10);
        const boundary = 'AsgardToolsBoundary' + Date.now();
        const bodyStr = '--' + boundary + CRLF +
          'Content-Disposition: form-data; name="metadata"' + CRLF +
          'Content-Type: application/json' + CRLF + CRLF +
          metadata + CRLF +
          '--' + boundary + CRLF +
          'Content-Disposition: form-data; name="' + main_module + '"; filename="' + main_module + '"' + CRLF +
          'Content-Type: ' + contentType + CRLF + CRLF +
          code + CRLF +
          '--' + boundary + '--';

        const r = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${cfToken}`,
              'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: bodyStr
          }
        );
        const j = await r.json();
        // Auto-enable workers.dev subdomain (safety: deploy could re-create worker with subdomain off)
        try {
          const _subRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}/subdomain`,
            { headers: { 'Authorization': `Bearer ${cfToken}` } }
          );
          if (_subRes.ok) {
            const _sub = await _subRes.json();
            if (_sub?.result?.enabled === false) {
              await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}/subdomain`,
                { method: 'POST', headers: { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ enabled: true, previews_enabled: true }) }
              );
            }
          }
        } catch {}
        return { ok: j.success, errors: j.errors, worker: j.result?.id, format: isClassic ? 'classic' : 'module' };
      }

      case 'get_secret': {
        const { key } = toolInput;
        // Prefer direct env binding (works from CF worker context, fast)
        if (env && env[key]) return { value: env[key], source: 'env' };
        // Fall back to vault (note: vault may 404 for some keys when called from CF worker context)
        const r = await fetch(`https://asgard-vault.pgallivan.workers.dev/secret/${key}`, {
          headers: { 'X-Pin': pin }
        });
        if (!r.ok) return { error: `Vault ${r.status} for ${key}; not in env either` };
        const val = await r.text();
        return { value: val, source: 'vault' };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (e) {
    return { error: e.message, stack: e.stack?.substring(0, 500) };
  }
}

async function handleChatSmart(request, env, corsHeaders) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeaders }); }

  try {
  const {
    message,
    messages = [],
    model = 'claude-sonnet-4-5',
    use_tools = true,
    system
  } = body;

  const msgs = [...messages];
  if (message) msgs.push({ role: 'user', content: message });
  if (!msgs.length) return Response.json({ error: 'No messages' }, { status: 400, headers: corsHeaders });

  // ---------- Multi-provider routing ----------
  // Claude models keep the full agent loop with tools. Other providers go through asgard-ai (chat-only, no tools yet).
  const isClaude = String(model).toLowerCase().startsWith('claude');
  if (!isClaude) {
    const pin = await getPin(env);
    const aiBody = { message, messages, model };
    if (system) aiBody.system = system;
    try {
      const aiRes = await fetch('https://asgard-ai.pgallivan.workers.dev/chat/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pin': pin },
        body: JSON.stringify(aiBody)
      });
      const data = await aiRes.json();
      if (!aiRes.ok) {
        return Response.json({ error: 'asgard-ai ' + aiRes.status, detail: data }, { status: 502, headers: corsHeaders });
      }
      const text = data.reply || data.response || data.text || data.content || data.message || '';
      return Response.json({
        response: text,
        text, content: text, message: text,
        model: data.model || model,
        provider: data.provider || 'unknown',
        usage: data.usage || null,
        iterations: 0,
        tools_executed: [],
        note: 'Routed through asgard-ai (chat-only, no agent tools for non-Claude models yet)'
      }, { headers: corsHeaders });
    } catch (e) {
      return Response.json({ error: 'asgard-ai forward failed', detail: e.message }, { status: 502, headers: corsHeaders });
    }
  }
  // ---------- end multi-provider ----------

  const claudeReq = {
    model,
    max_tokens: 8192,
    system: system || SYSTEM_PROMPT,
    messages: msgs,
    ...(use_tools !== false ? { tools: TOOLS } : {})
  };

  let finalResponse = null;
  let iterations = 0;
  const MAX_ITER = 25;
  const toolsExecuted = [];

  while (iterations < MAX_ITER) {
    iterations++;

    // Call Anthropic API directly — key read from vault
    const anthropicKey = await getAnthropicKey(env);
    const r = await fetch('https://gateway.ai.cloudflare.com/v1/a6f47c17811ee2f8b6caeb8f38768c20/falkor/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeReq)
    });

    if (!r.ok) {
      const err = await r.text();
      return Response.json({ error: `Anthropic ${r.status}`, detail: err }, { status: 502, headers: corsHeaders });
    }

    finalResponse = await r.json();
    if (finalResponse.stop_reason !== 'tool_use') break;

    // Execute all tool calls
    const toolResults = [];
    for (const block of finalResponse.content) {
      if (block.type !== 'tool_use') continue;
      console.log(`[asgard-tools] tool=${block.name} input=${JSON.stringify(block.input).substring(0, 300)}`);
      const result = await executeTool(block.name, block.input, env);
      toolsExecuted.push({ tool: block.name, input: block.input, result });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }

    claudeReq.messages = [
      ...claudeReq.messages,
      { role: 'assistant', content: finalResponse.content },
      { role: 'user', content: toolResults }
    ];
  }

  const text = finalResponse?.content?.find(b => b.type === 'text')?.text ?? '';

  return Response.json({
    response: text,
    text: text,        // alias for dashboards expecting `text`
    content: text,     // alias for dashboards expecting `content`
    message: text,     // alias for dashboards expecting `message`
    model: finalResponse?.model,
    usage: finalResponse?.usage,
    iterations,
    tools_executed: toolsExecuted.map(t => t.tool)
  }, { headers: corsHeaders });
  } catch(e) {
    return Response.json({ error: 'Internal error', detail: e.message, stack: e.stack?.substring(0, 500) }, { status: 500, headers: corsHeaders });
  }
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Pin, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);

    if (pathname === '/health' || pathname === '/ready') {
      return Response.json({ ok: true, worker: 'asgard-tools', version: VERSION }, { headers: cors });
    }

    if (pathname === '/chat/smart' && request.method === 'POST') {
      return handleChatSmart(request, env, cors);
    }

    // /admin/projects — live CF inventory
    if (pathname === '/admin/projects' && request.method === 'GET') {
      try {
        const cfToken = await getCfToken(env);
        const ACCT = 'a6f47c17811ee2f8b6caeb8f38768c20';
        const [w, p] = await Promise.all([
          fetch('https://api.cloudflare.com/client/v4/accounts/'+ACCT+'/workers/scripts', { headers: { Authorization: 'Bearer '+cfToken } }).then(r=>r.json()),
          fetch('https://api.cloudflare.com/client/v4/accounts/'+ACCT+'/pages/projects', { headers: { Authorization: 'Bearer '+cfToken } }).then(r=>r.json())
        ]);
        return Response.json({
          workers: (w.result||[]).map(x=>x.id).sort(),
          pages: (p.result||[]).map(x=>({name:x.name, subdomain:x.subdomain, domains:x.domains||[]})),
          generated_at: new Date().toISOString()
        }, { headers: cors });
      } catch(e) { return Response.json({error:e.message}, { status:500, headers:cors }); }
    }

    // /admin/get-worker — POST {worker_name, main_module?} → live worker JS source
    if (pathname === '/admin/get-worker' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_get = [env.PADDY_PIN || '2967', env.AGENT_PIN, env.VAULT_PIN || '535554'].filter(Boolean);
      if (!_validPins_get.includes(pin)) return Response.json({error:'Forbidden'}, {status:403, headers:cors});
      let body; try { body = await request.json(); } catch { return Response.json({error:'Invalid JSON'}, {status:400, headers:cors}); }
      const { worker_name, main_module } = body;
      if (!worker_name) return Response.json({error:'worker_name required'}, {status:400, headers:cors});
      const cfToken = await getCfToken(env);
      const r = await fetch(
        'https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT_ID + '/workers/scripts/' + worker_name,
        { headers: { 'Authorization': 'Bearer ' + cfToken } }
      );
      if (!r.ok) return Response.json({error: 'CF API ' + r.status, detail:(await r.text()).substring(0,500)}, {status:500, headers:cors});
      const ct = r.headers.get('Content-Type') || '';
      const text = await r.text();
      if (ct.startsWith('application/javascript') && !ct.includes('multipart')) {
        return new Response(text, { status:200, headers: {...cors, 'Content-Type':'application/javascript; charset=utf-8', 'X-Format':'classic', 'X-Length': String(text.length)} });
      }
      const bm = ct.match(/boundary=([^;]+)/);
      if (!bm) return Response.json({error:'No boundary', ct}, {status:500, headers:cors});
      const boundary = bm[1].trim().replace(/^"|"$/g, '');
      const parts = text.split('--' + boundary).slice(1, -1);
      const cands = [];
      for (const raw of parts) {
        let p = raw.replace(/^\r?\n/, '');
        let si = p.indexOf('\r\n\r\n'); let sl = 4;
        if (si === -1) { si = p.indexOf('\n\n'); sl = 2; }
        if (si === -1) continue;
        const hdrs = p.substring(0, si);
        let bp = p.substring(si + sl).replace(/\r?\n$/, '');
        const fn = hdrs.match(/filename="([^"]+)"/);
        const nm = hdrs.match(/name="([^"]+)"/);
        cands.push({ filename: fn ? fn[1] : (nm ? nm[1] : ''), body: bp });
      }
      const wm = main_module || 'worker.js';
      let pick = cands.find(c => c.filename === wm) || cands.find(c => /\.m?js$/i.test(c.filename)) || cands.find(c => c.filename && c.filename !== 'metadata');
      if (!pick) return Response.json({error:'No JS part', filenames: cands.map(c=>c.filename)}, {status:500, headers:cors});
      return new Response(pick.body, { status:200, headers: {...cors, 'Content-Type':'application/javascript; charset=utf-8', 'X-Format':'module', 'X-Part-Name':pick.filename, 'X-Length':String(pick.body.length)} });
    }

    // /admin/get-worker — POST {worker_name, main_module?} → live worker JS source
    if (pathname === '/admin/get-worker' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_get = [env.PADDY_PIN || '2967', env.AGENT_PIN, env.VAULT_PIN || '535554'].filter(Boolean);
      if (!_validPins_get.includes(pin)) return Response.json({error:'Forbidden'}, {status:403, headers:cors});
      let body; try { body = await request.json(); } catch { return Response.json({error:'Invalid JSON'}, {status:400, headers:cors}); }
      const { worker_name, main_module } = body;
      if (!worker_name) return Response.json({error:'worker_name required'}, {status:400, headers:cors});
      const cfToken = await getCfToken(env);
      const r = await fetch(
        'https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT_ID + '/workers/scripts/' + worker_name,
        { headers: { 'Authorization': 'Bearer ' + cfToken } }
      );
      if (!r.ok) return Response.json({error: 'CF API ' + r.status, detail:(await r.text()).substring(0,500)}, {status:500, headers:cors});
      const ct = r.headers.get('Content-Type') || '';
      const text = await r.text();
      if (ct.startsWith('application/javascript') && !ct.includes('multipart')) {
        return new Response(text, { status:200, headers: {...cors, 'Content-Type':'application/javascript; charset=utf-8', 'X-Format':'classic', 'X-Length': String(text.length)} });
      }
      const bm = ct.match(/boundary=([^;]+)/);
      if (!bm) return Response.json({error:'No boundary', ct}, {status:500, headers:cors});
      const boundary = bm[1].trim().replace(/^"|"$/g, '');
      const parts = text.split('--' + boundary).slice(1, -1);
      const cands = [];
      for (const raw of parts) {
        let p = raw.replace(/^\r?\n/, '');
        let si = p.indexOf('\r\n\r\n'); let sl = 4;
        if (si === -1) { si = p.indexOf('\n\n'); sl = 2; }
        if (si === -1) continue;
        const hdrs = p.substring(0, si);
        let bp = p.substring(si + sl).replace(/\r?\n$/, '');
        const fn = hdrs.match(/filename="([^"]+)"/);
        const nm = hdrs.match(/name="([^"]+)"/);
        cands.push({ filename: fn ? fn[1] : (nm ? nm[1] : ''), body: bp });
      }
      const wm = main_module || 'worker.js';
      let pick = cands.find(c => c.filename === wm) || cands.find(c => /\.m?js$/i.test(c.filename)) || cands.find(c => c.filename && c.filename !== 'metadata');
      if (!pick) return Response.json({error:'No JS part', filenames: cands.map(c=>c.filename)}, {status:500, headers:cors});
      return new Response(pick.body, { status:200, headers: {...cors, 'Content-Type':'application/javascript; charset=utf-8', 'X-Format':'module', 'X-Part-Name':pick.filename, 'X-Length':String(pick.body.length)} });
    }

    // /admin/patch — find/replace on a worker source, then redeploy. POST {worker_name, find, replace, main_module}
    if (pathname === '/admin/patch' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_patch = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_patch.includes(pin)) return Response.json({error:'Forbidden'}, {status:403, headers:cors});
      let body; try { body = await request.json(); } catch { return Response.json({error:'Invalid JSON'}, {status:400, headers:cors}); }
      const { worker_name, find, replace, main_module='worker.js' } = body;
      if (!worker_name || typeof find !== 'string' || typeof replace !== 'string') return Response.json({error:'worker_name, find, replace required'}, {status:400, headers:cors});
      const cur = await executeTool('get_worker_code', { worker_name }, env);
      if (cur.error) return Response.json(cur, { status:500, headers:cors });
      const code = cur.code;
      const occurrences = code.split(find).length - 1;
      if (occurrences === 0) return Response.json({error:'find string not found', find_preview: find.substring(0,100)}, {status:404, headers:cors});
      if (occurrences > 1) return Response.json({error:'find string matches '+occurrences+' times — must be unique', occurrences}, {status:409, headers:cors});
      const patched = code.replace(find, replace);
      const result = await executeTool('deploy_worker', { worker_name, code: patched, main_module }, env);
      return Response.json({ deployed: result.ok === true, occurrences, before_len: code.length, after_len: patched.length, ...result }, { headers: cors });
    }

    // /admin/binding-add — add a binding to an existing worker without redeploying code
    // POST { worker_name, binding: {type:'d1', name:'DB', id:'<uuid>'} OR {type:'kv_namespace', name:'KV', namespace_id:'<id>'} }
    if (pathname === '/admin/binding-add' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_ba = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_ba.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      let p;
      try { p = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { worker_name, binding } = p;
      if (!worker_name || !binding || !binding.type || !binding.name) {
        return Response.json({ error: 'worker_name and binding {type,name,...} required' }, { status: 400, headers: cors });
      }
      const cfTokenBA = await getCfToken(env);
      // 1. Fetch current bindings
      const getRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}/settings`,
        { headers: { 'Authorization': `Bearer ${cfTokenBA}` } }
      );
      const getJ = await getRes.json();
      if (!getJ.success) {
        return Response.json({ error: 'Failed to fetch current settings', detail: getJ.errors }, { status: 500, headers: cors });
      }
      const current = getJ.result || {};
      const existingBindings = current.bindings || [];
      // Filter out any binding with the same name (to replace)
      const newBindings = existingBindings.filter(b => b.name !== binding.name);
      newBindings.push(binding);
      // 2. PATCH with new bindings
      const settings = {
        bindings: newBindings,
        compatibility_date: current.compatibility_date,
        compatibility_flags: current.compatibility_flags,
        usage_model: current.usage_model
      };
      const CRLF2 = String.fromCharCode(13, 10);
      const boundary2 = 'AsgardBindingBoundary' + Date.now();
      const bodyStr2 = '--' + boundary2 + CRLF2 +
        'Content-Disposition: form-data; name="settings"' + CRLF2 +
        'Content-Type: application/json' + CRLF2 + CRLF2 +
        JSON.stringify(settings) + CRLF2 +
        '--' + boundary2 + '--';
      const patchRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}/settings`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${cfTokenBA}`,
            'Content-Type': `multipart/form-data; boundary=${boundary2}`
          },
          body: bodyStr2
        }
      );
      const patchJ = await patchRes.json();
      return Response.json({
        ok: patchJ.success === true,
        worker: worker_name,
        binding_added: binding.name,
        total_bindings: newBindings.length,
        previous_count: existingBindings.length,
        errors: patchJ.errors
      }, { headers: cors });
    }

    // /admin/kv-delete — delete a key from any KV namespace. POST {namespace_id, key}
    if (pathname === '/admin/kv-delete' && request.method === 'POST') {
      const pin_kd = request.headers.get('X-Pin');
      const _vp_kd = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_vp_kd.includes(pin_kd)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      let body_kd;
      try { body_kd = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { namespace_id, key } = body_kd;
      if (!namespace_id || !key) return Response.json({ error: 'namespace_id and key required' }, { status: 400, headers: cors });
      const cfTok_kd = await getCfToken(env);
      const r_kd = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${namespace_id}/values/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${cfTok_kd}` }
      });
      const j_kd = await r_kd.json();
      return Response.json(j_kd, { headers: cors });
    }

    // /admin/secret-set — set a Worker secret on any script. POST {worker_name, name, text}
    if (pathname === '/admin/secret-set' && request.method === 'POST') {
      const pin_ss = request.headers.get('X-Pin');
      const _validPins_ss = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_ss.includes(pin_ss)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      let payload;
      try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { worker_name, name, text } = payload;
      if (!worker_name || !name || text === undefined) return Response.json({ error: 'worker_name, name, text required' }, { status: 400, headers: cors });
      const cfTokenSS = await getCfToken(env);
      const r_ss = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${worker_name}/secrets`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${cfTokenSS}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text, type: 'secret_text' })
      });
      const j_ss = await r_ss.json();
      return Response.json(j_ss, { headers: cors });
    }

    // /admin/sql — run SQL on any D1 database (by id)
    if (pathname === '/admin/sql' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_sql = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_sql.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      let payload;
      try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { d1_id, sql, params = [] } = payload;
      if (!d1_id || !sql) return Response.json({ error: 'd1_id and sql required' }, { status: 400, headers: cors });
      const cfTokenSql = await getCfToken(env);
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${d1_id}/query`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${cfTokenSql}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql, params })
        }
      );
      const j = await r.json();
      return Response.json(j, { headers: cors });
    }

    // /admin/d1-list — list all D1 databases in the account
    if (pathname === '/admin/d1-list' && request.method === 'GET') {
      const pin = new URL(request.url).searchParams.get('pin') || request.headers.get('X-Pin');
      const _validPins_d1 = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_d1.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      const cfTokenL = await getCfToken(env);
      const r = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database`,
        { headers: { 'Authorization': `Bearer ${cfTokenL}` } }
      );
      const j = await r.json();
      return Response.json(j, { headers: cors });
    }

    // /admin/get-worker — read current source of any worker (uses existing get_worker_code tool)
    if (pathname === '/admin/get-worker' && request.method === 'GET') {
      const pin = new URL(request.url).searchParams.get('pin') || request.headers.get('X-Pin');
      const _validPins_gw = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_gw.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      const wn = new URL(request.url).searchParams.get('name');
      if (!wn) return Response.json({ error: 'name required' }, { status: 400, headers: cors });
      const result = await executeTool('get_worker_code', { worker_name: wn }, env);
      return Response.json(result, { headers: cors });
    }

    // /admin/patch-worker — find-and-replace inside a worker source, then redeploy
    // POST {worker_name, find, replace, main_module?}  X-Pin
    if (pathname === '/admin/patch-worker' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _vp = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_vp.includes(pin)) return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      let p; try { p = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { worker_name, find, replace, main_module = 'worker.js' } = p;
      if (!worker_name || typeof find !== 'string' || typeof replace !== 'string') {
        return Response.json({ error: 'worker_name, find, replace (strings) required' }, { status: 400, headers: cors });
      }
      const cur = await executeTool('get_worker_code', { worker_name }, env);
      if (cur.error) return Response.json({ error: 'get_worker_code: ' + cur.error }, { status: 500, headers: cors });
      const code = cur.code;
      const occ = code.split(find).length - 1;
      if (occ === 0) return Response.json({ error: 'find string not in source', find_preview: find.substring(0,100) }, { status: 404, headers: cors });
      if (occ > 1) return Response.json({ error: 'find matches ' + occ + ' times — must be unique' }, { status: 409, headers: cors });
      const patched = code.replace(find, replace);
      const result = await executeTool('deploy_worker', { worker_name, code: patched, main_module }, env);
      return Response.json({ ok: result.ok === true, occurrences: occ, deploy: result }, { headers: cors });
    }

    // /admin/deploy — direct deploy endpoint for large payloads (no LLM in the loop)
    // POST { worker_name, code_b64, main_module? }  X-Pin: <pin>
        // /admin/env-keys — list env binding KEYS (not values) for inventory
    if (pathname === '/admin/env-keys' && request.method === 'GET') {
      const pin = request.headers.get('X-Pin') || new URL(request.url).searchParams.get('pin');
      const _validPins_keys = [env.PADDY_PIN || '2967', env.AGENT_PIN, env.VAULT_PIN || '535554'].filter(Boolean);
      if (!_validPins_keys.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      const keys = [];
      for (const k of Object.keys(env || {})) {
        const v = env[k];
        if (typeof v === 'string') keys.push(k);
      }
      return Response.json({ keys: keys.sort() }, { headers: cors });
    }

    // /admin/gh-write — write a file to GitHub via API
    if (pathname === '/admin/gh-write' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_gh = [env.PADDY_PIN || '2967', env.AGENT_PIN, env.VAULT_PIN || '535554'].filter(Boolean);
      if (!_validPins_gh.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      let payload;
      try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { repo, path: filePath, content_b64, message, branch = 'main' } = payload;
      if (!repo || !filePath || !content_b64) return Response.json({ error: 'repo, path, content_b64 required' }, { status: 400, headers: cors });
      const token = env.GITHUB_TOKEN;
      if (!token) return Response.json({ error: 'GITHUB_TOKEN missing' }, { status: 500, headers: cors });
      // Get current SHA
      let sha = null;
      const getR = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'User-Agent': 'asgard-tools' }
      });
      if (getR.ok) {
        const meta = await getR.json();
        sha = meta.sha;
      }
      // PUT new content
      const putR = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'asgard-tools' },
        body: JSON.stringify({ message: message || ('Update ' + filePath), content: content_b64, sha, branch })
      });
      const result = await putR.json();
      return Response.json({ status: putR.status, body: result }, { headers: cors });
    }

    // /admin/cf-api — generic Cloudflare API proxy (uses stored CF_API_TOKEN, locked to PADDY/AGENT PIN)
    // POST { path: "/zones/{id}/settings/security_header", method: "PATCH", body: {...} }
    if (pathname === '/admin/pages-deploy' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPinsPD = [env.PADDY_PIN || '2967', env.AGENT_PIN, env.VAULT_PIN || '535554'].filter(Boolean);
      if (!_validPinsPD.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      let payload;
      try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { account_id, project, manifest, branch } = payload;
      if (!account_id || !project || !manifest) return Response.json({ error: 'account_id, project, manifest required' }, { status: 400, headers: cors });
      const cfToken = env.CF_FULLOPS_TOKEN || env.CF_API_TOKEN;
      if (!cfToken) return Response.json({ error: 'no CF token' }, { status: 500, headers: cors });
      // Build multipart manually
      const boundary = '----asgardtools' + Math.random().toString(36).slice(2);
      const manifestStr = typeof manifest === 'string' ? manifest : JSON.stringify(manifest);
      const branchStr = branch || 'main';
      const parts = [];
      parts.push('--' + boundary + '\r\n');
      parts.push('Content-Disposition: form-data; name="manifest"\r\n\r\n');
      parts.push(manifestStr + '\r\n');
      parts.push('--' + boundary + '\r\n');
      parts.push('Content-Disposition: form-data; name="branch"\r\n\r\n');
      parts.push(branchStr + '\r\n');
      parts.push('--' + boundary + '--\r\n');
      const body = parts.join('');
      const url = 'https://api.cloudflare.com/client/v4/accounts/' + account_id + '/pages/projects/' + project + '/deployments';
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + cfToken,
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
        },
        body,
      });
      const text = await resp.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
      return Response.json({ status: resp.status, body: parsed }, { headers: cors });
    }

    if (pathname === '/admin/cf-api' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_cf = [env.PADDY_PIN || '2967', env.AGENT_PIN, env.VAULT_PIN || '535554'].filter(Boolean);
      if (!_validPins_cf.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      let payload;
      try { payload = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { path: cfPath, method: cfMethod = 'GET', body: cfBody } = payload;
      if (!cfPath || !cfPath.startsWith('/')) return Response.json({ error: 'path required, starting with /' }, { status: 400, headers: cors });
      // Prefer CF_FULLOPS_TOKEN (broader scope: Zone:Edit) if available, else CF_API_TOKEN
      const cfToken = env.CF_FULLOPS_TOKEN || await getCfToken(env);
      const cfRes = await fetch('https://api.cloudflare.com/client/v4' + cfPath, {
        method: cfMethod,
        headers: {
          'Authorization': 'Bearer ' + cfToken,
          'Content-Type': 'application/json'
        },
        body: cfBody ? JSON.stringify(cfBody) : undefined
      });
      const text = await cfRes.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
      return Response.json({ status: cfRes.status, body: parsed }, { headers: cors });
    }

if (pathname === '/admin/deploy' && request.method === 'POST') {
      const pin = request.headers.get('X-Pin');
      const _validPins_deploy = [env.PADDY_PIN || '2967', env.AGENT_PIN].filter(Boolean);
      if (!_validPins_deploy.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      let payload;
      try { payload = await request.json(); }
      catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }); }
      const { worker_name, code_b64, main_module = 'worker.js', compatibility_date, compatibility_flags } = payload;
      if (!worker_name || !code_b64) {
        return Response.json({ error: 'worker_name and code_b64 required' }, { status: 400, headers: cors });
      }
      let code;
      try {
        // atob returns binary string; convert to UTF-8 properly
        const binary = atob(code_b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        code = new TextDecoder('utf-8').decode(bytes);
      } catch (e) {
        return Response.json({ error: 'Invalid base64', detail: e.message }, { status: 400, headers: cors });
      }
      try {
        const result = await executeTool('deploy_worker', { worker_name, code, main_module, compatibility_date, compatibility_flags }, env);
        return Response.json({ deployed: result.ok === true, ...result }, { headers: cors });
      } catch (e) {
        return Response.json({ error: 'Deploy failed', detail: e.message }, { status: 500, headers: cors });
      }
    }


    // /brief — morning brief: falkor-agent health, workflows health, worker fleet
    // GET /brief?pin=<VAULT_PIN>  OR  X-Pin header
    if (pathname === '/brief' && request.method === 'GET') {
      const qpin = new URL(request.url).searchParams.get('pin');
      const pin = qpin || request.headers.get('X-Pin');
      const validPins = [env.VAULT_PIN || '535554', env.AGENT_PIN].filter(Boolean);
      if (!validPins.includes(pin)) {
        return Response.json({ error: 'Forbidden' }, { status: 403, headers: cors });
      }
      try {
        const AGENT_PIN = env.AGENT_PIN;
        async function probeWorker(url, timeoutMs = 3000, retries = 1) {
          for (let attempt = 0; attempt <= retries; attempt++) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), timeoutMs);
            try {
              const r = await fetch(url, { headers: { 'X-Pin': AGENT_PIN }, signal: ctrl.signal });
              clearTimeout(timer);
              if (r.status >= 500 && attempt < retries) continue;
              const body = await r.json().catch(() => ({}));
              return { ok: r.ok, status: r.status, ...body };
            } catch (e) {
              clearTimeout(timer);
              if (attempt === retries) return { ok: false, error: e.name === 'AbortError' ? `timeout ${timeoutMs}ms` : e.message };
            }
          }
        }
        const [agentHealth, wfHealth, brainHealth] = await Promise.all([
          probeWorker('https://falkor-agent.pgallivan.workers.dev/health'),
          probeWorker('https://falkor-workflows.pgallivan.workers.dev/health'),
          probeWorker('https://falkor-brain.pgallivan.workers.dev/health'),
        ]);

        // Route through asgard-ai (holds ANTHROPIC_API_KEY binding + CF AI Gateway)
        const briefPrompt = 'Give a concise Falkor status brief (4-6 bullets). Flag anything wrong. Today: ' +
          new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
          '\n\nAgent: ' + JSON.stringify(agentHealth) +
          '\nWorkflows: ' + JSON.stringify(wfHealth) +
          '\nBrain: ' + JSON.stringify(brainHealth);
        const llmRes = await fetch('https://asgard-ai.luckdragon.io/chat/smart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pin': AGENT_PIN },
          body: JSON.stringify({ model: 'haiku', message: briefPrompt, use_tools: false })
        });
        const llmData = await llmRes.json();
        const brief = llmData.reply || llmData.response || llmData.text || llmData.content || llmData.message || 'LLM unavailable.';
        return Response.json({
          brief,
          raw: { agent: agentHealth, workflows: wfHealth, brain: brainHealth },
          generated_at: new Date().toISOString()
        }, { headers: cors });
      } catch (e) {
        return Response.json({ error: 'Brief failed', detail: e.message }, { status: 500, headers: cors });
      }
    }

    return new Response('Not found', { status: 404, headers: cors });
  }
};