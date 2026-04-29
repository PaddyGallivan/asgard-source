// ASGARD BRAIN — Claude-powered agentic worker
// v1.3 (2026-04-24): cf_deploy now auto-posts to asgard-comms /v1/capture after
//                    a successful deploy (fire-and-forget).
// v1.2 (2026-04-23): added /d1/query + /d1/write direct REST routes (bypass the LLM
//                    so SQL isn't silently rewritten). Pin-gated with X-Pin header
//                    or ?pin= query param (PADDY_PIN / JACKY_PIN).
// v1.1 (2026-04-23): cf_delete, cf_get_worker, cf_subdomain_enable tools; cf_deploy
//                    now auto-enables workers.dev subdomain on fresh deploys.

export default {
  async fetch(request, env) {
    const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Allow-Headers": "*" };
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, worker: "asgard-brain", version: "1.2", tools: TOOLS.map(t => t.name), direct_routes: ["/d1/query", "/d1/write"] }, { headers: CORS });
    }

    // Direct D1 routes — bypass the Claude LLM so SQL isn't rewritten.
    if ((url.pathname === "/d1/query" || url.pathname === "/d1/write") && request.method === "POST") {
      const pin = request.headers.get("X-Pin") || url.searchParams.get("pin") || "";
      if (pin !== env.PADDY_PIN && pin !== env.JACKY_PIN) {
        return Response.json({ ok: false, error: "pin required or invalid" }, { status: 401, headers: CORS });
      }
      if (!env.DB) return Response.json({ ok: false, error: "DB binding missing" }, { status: 500, headers: CORS });
      try {
        const { sql, params = [] } = await request.json();
        if (!sql || typeof sql !== "string") return Response.json({ ok: false, error: "sql required" }, { status: 400, headers: CORS });
        const stmt = env.DB.prepare(sql);
        const bound = (params && params.length) ? stmt.bind(...params) : stmt;
        let out;
        if (url.pathname === "/d1/query") {
          const r = await bound.all();
          out = { ok: true, results: r.results, meta: r.meta };
        } else {
          const r = await bound.run();
          out = { ok: true, success: r.success, meta: r.meta };
        }
        return Response.json(out, { headers: CORS });
      } catch (e) {
        return Response.json({ ok: false, error: String(e.message || e) }, { status: 500, headers: CORS });
      }
    }

    if (url.pathname === "/tools") {
      return Response.json({ tools: TOOLS.map(t => ({ name: t.name, description: t.description })) }, { headers: CORS });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      try {
        const { task, context, stream } = await request.json();
        if (!task) return Response.json({ error: "task required" }, { status: 400, headers: CORS });
        const result = await runAgent(task, context || "", env);
        return Response.json({ ok: true, result, task }, { headers: CORS });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500, headers: CORS });
      }
    }

    if (url.pathname === "/ask" && request.method === "POST") {
      try {
        const { prompt, system } = await request.json();
        const answer = await askClaude(prompt, system || SYSTEM_PROMPT, env);
        return Response.json({ ok: true, answer }, { headers: CORS });
      } catch (e) {
        return Response.json({ error: e.message }, { status: 500, headers: CORS });
      }
    }

    return Response.json({
      worker: "asgard-brain",
      endpoints: ["/health", "/tools", "/run", "/ask", "/d1/query", "/d1/write"],
      description: "Claude-powered agentic brain for Asgard"
    }, { headers: CORS });
  }
};

const SYSTEM_PROMPT = `You are Asgard Brain — the AI core of Paddy Gallivan's Asgard platform.
You are running inside a Cloudflare Worker with direct access to tools that let you:
- Fetch and read any URL on the web
- Query the Asgard D1 database (b6275cb4-9c0f-4649-ae6a-f1c2e70e940f)
- Deploy, delete, fetch source of, and enable subdomains for Cloudflare Workers via the CF API
- Send Slack messages to the Asgard workspace
- Call any Asgard worker endpoint
- Ask Craftsman (Claude API) to write code

Rules:
- Be direct and action-oriented
- Use tools to verify before claiming
- Always complete the task, don't just describe it
- When a D1 write would mutate schema, prefer the caller's direct /d1/query or /d1/write route — you (the LLM) can rewrite SQL unintentionally.`;

const TOOLS = [
  { name: "web_fetch", description: "Fetch the content of any URL. Returns the text/HTML content.", input_schema: { type: "object", properties: { url: { type: "string" }, method: { type: "string", enum: ["GET", "POST"] }, body: { type: "string" }, headers: { type: "object" } }, required: ["url"] } },
  { name: "d1_query", description: "Query the Asgard D1 database (SELECT).", input_schema: { type: "object", properties: { sql: { type: "string" }, params: { type: "array", items: { type: "string" } } }, required: ["sql"] } },
  { name: "d1_write", description: "Write to the Asgard D1 database (INSERT/UPDATE/DELETE).", input_schema: { type: "object", properties: { sql: { type: "string" }, params: { type: "array", items: {} } }, required: ["sql"] } },
  { name: "worker_call", description: "Call any Asgard worker endpoint.", input_schema: { type: "object", properties: { worker: { type: "string" }, path: { type: "string" }, method: { type: "string" }, body: { type: "object" }, gatekeeper: { type: "boolean" } }, required: ["worker"] } },
  { name: "cf_deploy", description: "Deploy or update a Cloudflare Worker. Auto-enables workers.dev subdomain on fresh deploys.", input_schema: { type: "object", properties: { name: { type: "string" }, code: { type: "string" }, bindings: { type: "array", items: { type: "object" } } }, required: ["name", "code"] } },
  { name: "slack_send", description: "Send a message to a Slack channel in the Asgard workspace.", input_schema: { type: "object", properties: { channel: { type: "string" }, message: { type: "string" }, priority: { type: "string" } }, required: ["channel", "message"] } },
  { name: "craftsman_build", description: "Ask Craftsman to write or fix code.", input_schema: { type: "object", properties: { task: { type: "string" }, context: { type: "string" }, worker_name: { type: "string" } }, required: ["task"] } },
  { name: "cf_workers_list", description: "List all deployed Cloudflare Workers.", input_schema: { type: "object", properties: {} } },
  { name: "cf_delete", description: "Delete a Cloudflare Worker by name.", input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "cf_get_worker", description: "Fetch source + bindings for a worker.", input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
  { name: "cf_subdomain_enable", description: "Enable *.workers.dev subdomain for a worker.", input_schema: { type: "object", properties: { name: { type: "string" }, enabled: { type: "boolean" } }, required: ["name"] } }
];

async function runAgent(task, context, env) {
  const messages = [{ role: "user", content: context ? `Context:\n${context}\n\nTask: ${task}` : task }];
  const MAX_TURNS = 10;
  let turns = 0;
  let finalResult = null;

  while (turns < MAX_TURNS) {
    turns++;
    const response = await callClaude(messages, env);
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      const text = response.content.filter(b => b.type === "text").map(b => b.text).join("");
      finalResult = text;
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(b => b.type === "tool_use");
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input, env);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: typeof result === "string" ? result : JSON.stringify(result) });
      }
      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  return finalResult || "Agent completed (no text response)";
}

async function callClaude(messages, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, system: SYSTEM_PROMPT, tools: TOOLS, messages })
  });
  if (!resp.ok) { const err = await resp.text(); throw new Error(`Claude API error ${resp.status}: ${err}`); }
  return await resp.json();
}

async function askClaude(prompt, system, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2048, system, messages: [{ role: "user", content: prompt }] })
  });
  const d = await resp.json();
  return d.content?.[0]?.text || "";
}

async function executeTool(name, input, env) {
  try {
    switch (name) {
      case "web_fetch": return await toolWebFetch(input);
      case "d1_query": return await toolD1Query(input, env);
      case "d1_write": return await toolD1Write(input, env);
      case "worker_call": return await toolWorkerCall(input, env);
      case "cf_deploy": return await toolCfDeploy(input, env);
      case "slack_send": return await toolSlackSend(input, env);
      case "craftsman_build": return await toolCraftsmanBuild(input, env);
      case "cf_workers_list": return await toolCfWorkersList(env);
      case "cf_delete": return await toolCfDelete(input, env);
      case "cf_get_worker": return await toolCfGetWorker(input, env);
      case "cf_subdomain_enable": return await toolCfSubdomainEnable(input, env);
      default: return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Tool error (${name}): ${e.message}`;
  }
}

async function toolWebFetch({ url, method = "GET", body, headers = {} }) {
  const opts = { method, headers: { "User-Agent": "AsgardBrain/1.2", ...headers }, signal: AbortSignal.timeout(10000) };
  if (body && method === "POST") { opts.body = body; opts.headers["Content-Type"] = "application/json"; }
  const r = await fetch(url, opts);
  const text = await r.text();
  return { status: r.status, url, content: text.slice(0, 8000), truncated: text.length > 8000 };
}

async function toolD1Query({ sql, params = [] }, env) {
  if (!env.DB) return { error: "No D1 binding" };
  const stmt = env.DB.prepare(sql);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  return { rows: result.results, count: result.results?.length };
}

async function toolD1Write({ sql, params = [] }, env) {
  if (!env.DB) return { error: "No D1 binding" };
  const stmt = env.DB.prepare(sql);
  const result = params.length > 0 ? await stmt.bind(...params).run() : await stmt.run();
  return { success: result.success, meta: result.meta };
}

async function toolWorkerCall({ worker, path = "/health", method = "GET", body, gatekeeper }, env) {
  const url = worker.startsWith("http") ? worker + path : `https://${worker}.pgallivan.workers.dev${path}`;
  const headers = { "Content-Type": "application/json" };
  if (gatekeeper && env.GATEKEEPER_KEY) headers["X-Gatekeeper"] = env.GATEKEEPER_KEY;
  const opts = { method, headers, signal: AbortSignal.timeout(8000) };
  if (body && ["POST", "PUT"].includes(method)) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  const text = await r.text();
  try { return { status: r.status, data: JSON.parse(text) }; }
  catch { return { status: r.status, data: text.slice(0, 2000) }; }
}


// ---- capture helper: fire-and-forget POST to asgard-comms /v1/capture ----
async function captureEvent(env, payload) {
  try {
    const url = 'https://asgard-comms.pgallivan.workers.dev/v1/capture';
    const pin = env.PADDY_PIN || env.JACKY_PIN || '';
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pin': pin,
        'X-Service': 'asgard-brain',
        'User-Agent': 'asgard-brain/1.3',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function toolCfDeploy({ name, code, bindings = [] }, env) {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  if (!token || !accountId) return { error: "Missing CF credentials" };

  const existsRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}/settings`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const wasNew = !existsRes.ok;

  const metadata = JSON.stringify({
    main_module: "index.js",
    compatibility_date: "2024-04-01",
    bindings: [{ name: "DB", type: "d1", id: "b6275cb4-9c0f-4649-ae6a-f1c2e70e940f" }, ...bindings]
  });

  const formData = new FormData();
  formData.append("metadata", new Blob([metadata], { type: "application/json" }));
  formData.append("index.js", new Blob([code], { type: "application/javascript+module" }), "index.js");

  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  const d = await r.json();

  let subdomain = null;
  if (d.success && wasNew) {
    const sub = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}/subdomain`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: true, previews_enabled: true })
    });
    subdomain = { ok: sub.ok, status: sub.status };
  }

  // fire-and-forget capture (don't await long; AbortSignal caps at 5s inside helper)
  if (d.success) {
    try {
      await captureEvent(env, {
        project: name,
        event: "deploy",
        summary: `cf_deploy ${wasNew ? "created" : "updated"} worker ${name}`,
        url: `https://${name}.pgallivan.workers.dev/`,
        source: "asgard-brain/cf_deploy",
        notify: false,
      });
    } catch {}
  }

  return { success: d.success, name, errors: d.errors, was_new: wasNew, subdomain };
}

async function toolCfDelete({ name }, env) {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  if (!token || !accountId) return { error: "Missing CF credentials" };
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}?force=true`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  const d = await r.json().catch(() => ({}));
  return { success: d.success ?? r.ok, name, deleted: r.ok, errors: d.errors };
}

async function toolCfGetWorker({ name }, env) {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  if (!token || !accountId) return { error: "Missing CF credentials" };
  const [scriptRes, settingsRes] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}`, { headers: { "Authorization": `Bearer ${token}` } }),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}/settings`, { headers: { "Authorization": `Bearer ${token}` } })
  ]);
  const scriptText = await scriptRes.text();
  const settings = await settingsRes.json().catch(() => ({}));
  return {
    success: scriptRes.ok && settingsRes.ok, name,
    script: scriptText, script_status: scriptRes.status,
    bindings: settings?.result?.bindings || [],
    compatibility_date: settings?.result?.compatibility_date || null,
    main_module: settings?.result?.main_module || null
  };
}

async function toolCfSubdomainEnable({ name, enabled = true }, env) {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  if (!token || !accountId) return { error: "Missing CF credentials" };
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${name}/subdomain`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, previews_enabled: true })
  });
  const d = await r.json().catch(() => ({}));
  return { success: d.success ?? r.ok, name, enabled, errors: d.errors };
}

async function toolSlackSend({ channel, message, priority = "NORMAL" }, env) {
  const r = await fetch("https://comms-hub.pgallivan.workers.dev/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "asgard-brain", type: "message", message, channel, priority })
  });
  const d = await r.json().catch(() => ({}));
  return { sent: r.ok, status: r.status, response: d };
}

async function toolCraftsmanBuild({ task, context, worker_name }, env) {
  const r = await fetch("https://craftsman.pgallivan.workers.dev/api/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, context, worker_name })
  });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, result: d };
}

async function toolCfWorkersList(env) {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  if (!token || !accountId) return { error: "Missing CF credentials" };
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const d = await r.json();
  return { count: d.result?.length, workers: d.result?.map(w => ({ name: w.id, modified: w.modified_on })) };
}