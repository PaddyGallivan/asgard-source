/**
 * Unified Asgard Platform Dashboard
 * Main entry point at falkor.luckdragon.io
 * Integrates: Projects, Chat, Agent, Workflows, Tools
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const pin = request.headers.get('X-Pin') || url.searchParams.get('pin') || '';

    // Routes
    if (path === '/' || path === '/dashboard') return handleDashboard(pin);
    if (path === '/api/projects') return handleProjects();
    if (path === '/api/chat' && request.method === 'POST') return handleChat(request, pin);
    if (path === '/api/agent/status') return handleAgentStatus();

    return new Response('Not found', { status: 404 });
  }
};

async function handleDashboard(pin) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asgard Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #0f0f11;
      --panel: #18181b;
      --border: #2a2a2e;
      --text: #e8e8ea;
      --muted: #888;
      --accent: #6c63ff;
      --accent2: #a78bfa;
    }
    body { 
      background: var(--bg); 
      color: var(--text); 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
      padding: 20px 40px;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .header h1 { font-size: 32px; font-weight: 700; letter-spacing: -1px; }
    .header p { font-size: 14px; opacity: 0.9; margin-top: 4px; }
    
    .nav-tabs {
      display: flex;
      gap: 0;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      padding: 0 40px;
    }
    .nav-tab {
      padding: 16px 24px;
      border: none;
      background: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }
    .nav-tab:hover { color: var(--text); }
    .nav-tab.active { 
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    
    .content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    .view { display: none; flex: 1; overflow-y: auto; }
    .view.active { display: flex; flex-direction: column; }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      padding: 40px;
    }
    
    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .card:hover {
      border-color: var(--accent);
      background: linear-gradient(135deg, rgba(108,99,255,0.05) 0%, rgba(167,139,250,0.05) 100%);
    }
    
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .card-desc { font-size: 13px; color: var(--muted); margin-bottom: 12px; line-height: 1.4; }
    .card-meta { font-size: 12px; color: var(--muted); display: flex; gap: 12px; }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-live { background: #238636; color: white; }
    .status-dev { background: #6e40aa; color: white; }
    .status-archived { background: #444c56; color: #c9d1d9; }
    .status-idea { background: #3b434b; color: #8b949e; }
    
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      flex-direction: column;
      color: var(--muted);
    }
    .empty-state-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    
    .sidebar-info {
      width: 320px;
      background: var(--panel);
      border-left: 1px solid var(--border);
      padding: 20px;
      overflow-y: auto;
    }
    .info-title { font-size: 14px; color: var(--muted); text-transform: uppercase; margin-bottom: 12px; }
    .info-item { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .info-item:last-child { border-bottom: none; }
    .info-label { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
    .info-value { font-size: 14px; color: var(--text); }
    
    .footer {
      background: var(--panel);
      border-top: 1px solid var(--border);
      padding: 12px 40px;
      font-size: 12px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Asgard Platform</h1>
    <p>Unified project management, chat, and automation hub</p>
  </div>
  
  <div class="nav-tabs">
    <button class="nav-tab active" onclick="switchView('projects')">📦 Projects</button>
    <button class="nav-tab" onclick="switchView('chat')">💬 Chat</button>
    <button class="nav-tab" onclick="switchView('agent')">🤖 Agent</button>
    <button class="nav-tab" onclick="switchView('workflows')">⚙️ Workflows</button>
    <button class="nav-tab" onclick="switchView('tools')">🔧 Tools</button>
  </div>
  
  <div class="content">
    <div id="projects" class="view active">
      <div class="grid" id="projectsGrid">
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <p>Loading projects...</p>
        </div>
      </div>
    </div>
    
    <div id="chat" class="view">
      <div style="padding: 40px; flex: 1; display: flex; flex-direction: column;">
        <h2 style="margin-bottom: 24px;">Falkor Chat</h2>
        <iframe 
          src="https://falkor.luckdragon.io/chat" 
          style="flex: 1; border: none; border-radius: 12px; background: var(--panel);"
          title="Falkor Chat">
        </iframe>
      </div>
    </div>
    
    <div id="agent" class="view">
      <div style="padding: 40px; flex: 1; display: flex; flex-direction: column;">
        <h2 style="margin-bottom: 24px;">Agent Status & Control</h2>
        <div style="background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 24px; flex: 1;">
          <div id="agentStatus" style="font-family: monospace; white-space: pre-wrap; overflow-y: auto; height: 100%;">
            Loading agent status...
          </div>
        </div>
      </div>
    </div>
    
    <div id="workflows" class="view">
      <div style="padding: 40px;">
        <h2 style="margin-bottom: 24px;">Workflows</h2>
        <div class="empty-state" style="height: 60vh;">
          <div class="empty-state-icon">⚙️</div>
          <p>Workflow management coming soon</p>
        </div>
      </div>
    </div>
    
    <div id="tools" class="view">
      <div style="padding: 40px;">
        <h2 style="margin-bottom: 24px;">Tools</h2>
        <div class="grid">
          <div class="card">
            <div class="card-title">🔍 Search</div>
            <div class="card-desc">Search across all projects and conversations</div>
          </div>
          <div class="card">
            <div class="card-title">📊 Analytics</div>
            <div class="card-desc">Project metrics and performance data</div>
          </div>
          <div class="card">
            <div class="card-title">🔐 Admin</div>
            <div class="card-desc">System administration and settings</div>
          </div>
          <div class="card">
            <div class="card-title">📝 Docs</div>
            <div class="card-desc">Documentation and guides</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <span>Asgard v2.0 • </span>
    <span id="footerStatus">Ready</span>
  </div>

  <script>
    let projects = [];
    
    function switchView(viewName) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      
      document.getElementById(viewName).classList.add('active');
      event.target.classList.add('active');
    }
    
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        projects = data.projects || [];
        renderProjects();
      } catch (e) {
        console.error('Failed to load projects:', e);
        document.getElementById('projectsGrid').innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><p>Failed to load projects</p></div>';
      }
    }
    
    function renderProjects() {
      const grid = document.getElementById('projectsGrid');
      if (!projects.length) {
        grid.innerHTML = '<div class="empty-state"><p>No projects found</p></div>';
        return;
      }
      
      const live = projects.filter(p => p.status === 'live');
      const dev = projects.filter(p => p.status === 'dev' || p.status === 'in-development');
      const archived = projects.filter(p => p.status === 'archived');
      const ideas = projects.filter(p => p.status === 'idea');
      
      grid.innerHTML = [
        ...live.map(p => renderCard(p, 'live')),
        ...dev.map(p => renderCard(p, 'dev')),
        ...archived.map(p => renderCard(p, 'archived')),
        ...ideas.map(p => renderCard(p, 'idea'))
      ].join('');
    }
    
    function renderCard(p, status) {
      return \`
        <div class="card" onclick="window.open('\${p.url || '#'}')">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span class="status-badge status-\${status}">\${status.toUpperCase()}</span>
          </div>
          <div class="card-title">\${p.name}</div>
          <div class="card-desc">\${p.description || ''}</div>
          <div class="card-meta">
            \${p.category ? \`<span>📁 \${p.category}</span>\` : ''}
            \${p.url ? \`<span>🌐 Live</span>\` : ''}
          </div>
        </div>
      \`;
    }
    
    async function loadAgentStatus() {
      try {
        const res = await fetch('/api/agent/status');
        const data = await res.json();
        document.getElementById('agentStatus').textContent = JSON.stringify(data, null, 2);
      } catch (e) {
        document.getElementById('agentStatus').textContent = 'Failed to load agent status';
      }
    }
    
    // Initialize
    loadProjects();
    loadAgentStatus();
  </script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleProjects() {
  try {
    const res = await fetch('https://falkor-projects.pgallivan.workers.dev/api/projects');
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: 'Failed to fetch projects', projects: [] }, { status: 500 });
  }
}

async function handleChat(request, pin) {
  // Proxy to falkor-agent chat endpoint
  return fetch('https://falkor-agent.luckdragon.io/chat', {
    method: request.method,
    headers: { ...Object.fromEntries(request.headers), 'X-Pin': pin },
    body: request.body
  });
}

async function handleAgentStatus() {
  try {
    const res = await fetch('https://falkor-agent.luckdragon.io/status', {
      headers: { 'X-Pin': '2967' }
    });
    return res;
  } catch (e) {
    return Response.json({ error: 'Agent unavailable' }, { status: 503 });
  }
}
