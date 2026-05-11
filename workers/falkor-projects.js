/**
 * falkor-projects.js - Asgard Project Dashboard & Management
 * Displays all projects (active, legacy, ideas) with per-project chat
 * Natural language commands route to Falkor for site edits
 */

const PROJECTS_DATA = [
  // Active Projects
  { id: 'carnival-timing', name: 'Carnival Timing', url: 'https://carnivaltiming.com', repo: 'LuckDragonAsgard/district-sport', status: 'live', category: 'Platform', description: 'Carnival timing & scoring platform', type: 'active' },
  { id: 'ssp', name: 'School Sport Portal', url: 'https://schoolsportportal.com.au', repo: 'LuckDragonAsgard/ssp', status: 'live', category: 'SaaS', description: '$1/student/yr sports management', type: 'active' },
  { id: 'sportcarnival', name: 'SportCarnival', url: 'https://sportcarnival.com.au', repo: 'LuckDragonAsgard/sportcarnival', status: 'live', category: 'Platform', description: 'District sports carnival hub', type: 'active' },
  { id: 'lessonlab', name: 'LessonLab', url: 'https://lessonlab.com.au', repo: 'LuckDragonAsgard/lessonlab', status: 'live', category: 'SaaS', description: 'Education SaaS platform', type: 'active' },
  { id: 'kbt', name: 'KBT Trivia Tools', url: 'https://kbt-trial.vercel.app/host-app', repo: 'LuckDragonAsgard/kbt-trivia-tools', status: 'live', category: 'Tool', description: 'Trivia hosting & asset pipeline', type: 'active' },
  { id: 'bomber-boat', name: 'Bomber Boat', url: 'https://bomberboat.com.au', repo: 'LuckDragonAsgard/bomber-boat', status: 'live', category: 'Game', description: 'Boat spotting game', type: 'active' },
  { id: 'superleague', name: 'Superleague Yeah v4', url: 'https://superleague.streamlinewebapps.com', repo: 'LuckDragonAsgard/superleague-yeah-v4', status: 'live', category: 'Game', description: 'AFL fantasy draft', type: 'active' },

  // Legacy Projects
  { id: 'bulldogs-boat', name: 'Bulldogs Boat', url: '', repo: 'PaddyGallivan/bulldogs-boat', status: 'archived', category: 'Game', description: 'Bulldogs version of boat game', type: 'legacy' },
  { id: 'hobsons-bay-dental', name: 'Hobsons Bay Dental', url: '', repo: '', status: 'archived', category: 'Business', description: 'Dental clinic site', type: 'legacy' },
  { id: 'smilehaus', name: 'Smilehaus', url: '', repo: '', status: 'archived', category: 'Business', description: 'Dental/health site', type: 'legacy' },
  { id: 'coat-carousel', name: 'Coat Carousel', url: '', repo: '', status: 'archived', category: 'Platform', description: 'Clothing rental marketplace', type: 'legacy' },
  { id: 'wcyms-footy-hub', name: 'WCYMS Footy Hub', url: '', repo: '', status: 'archived', category: 'Community', description: 'Local footy hub', type: 'legacy' },
  { id: 'long-range-tipping', name: 'Long Range Tipping', url: '', repo: '', status: 'archived', category: 'Game', description: 'AFL tipping competition', type: 'legacy' },
  { id: 'district-sport', name: 'District Sport', url: '', repo: '', status: 'archived', category: 'Platform', description: 'District sports management', type: 'legacy' },
  { id: 'ssv-hub', name: 'SSV Hub + API', url: '', repo: '', status: 'archived', category: 'Community', description: 'Community hub API', type: 'legacy' },

  // Ideas
  { id: 'neighbourgoods', name: 'NeighbourGoods', url: '', repo: '', status: 'idea', category: 'Platform', description: 'Neighbourhood sharing marketplace', type: 'idea' },
  { id: 'sidequest', name: 'SideQuest', url: '', repo: '', status: 'idea', category: 'Game', description: 'Gamified task/quest platform', type: 'idea' },
  { id: 'skipthesmalltalk', name: 'Skip The Small Talk', url: '', repo: '', status: 'idea', category: 'Social', description: 'Meaningful conversation starter', type: 'idea' },
  { id: 'the-table', name: 'The Table', url: '', repo: '', status: 'idea', category: 'Community', description: 'Community dining & connection', type: 'idea' },
  { id: 'packleader', name: 'PackLeader', url: '', repo: '', status: 'idea', category: 'Social', description: 'Group coordination tool', type: 'idea' },
  { id: 'parkup', name: 'ParkUp', url: '', repo: '', status: 'idea', category: 'Utility', description: 'Parking spot sharing app', type: 'idea' },
  { id: 'the-local', name: 'The Local', url: '', repo: '', status: 'idea', category: 'OS', description: '13-feature neighbourhood OS', type: 'idea' },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const pin = request.headers.get('X-Pin') || url.searchParams.get('pin') || '';

    // Routes
    if (path === '/') return handleHome(env, pin);
    if (path === '/api/projects') return handleGetProjects(env);
    if (path === '/api/project' && url.searchParams.get('id')) return handleGetProject(env, url.searchParams.get('id'));
    if (path === '/api/chat' && request.method === 'POST') return handleChat(request, env, pin);
    if (path === '/api/edit-project' && request.method === 'POST') return handleEditProject(request, env, pin);

    return new Response('Not found', { status: 404 });
  }
};

async function handleHome(env, pin) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Projects - Asgard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
    .header { margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-btn { padding: 8px 16px; border: 1px solid #30363d; background: transparent; color: #c9d1d9; cursor: pointer; border-radius: 6px; font-size: 12px; text-transform: uppercase; transition: all 0.2s; }
    .filter-btn.active { background: #1f6feb; border-color: #1f6feb; }
    .filter-btn:hover { border-color: #58a6ff; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .project-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; cursor: pointer; transition: all 0.2s; }
    .project-card:hover { border-color: #58a6ff; background: #0d1117; }
    .project-status { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-bottom: 8px; }
    .status-live { background: #238636; color: #fff; }
    .status-archived { background: #444c56; color: #c9d1d9; }
    .status-idea { background: #6e40aa; color: #fff; }
    .project-name { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .project-desc { font-size: 13px; color: #8b949e; margin-bottom: 10px; line-height: 1.4; }
    .project-links { display: flex; gap: 8px; font-size: 12px; }
    .link-btn { color: #58a6ff; text-decoration: none; padding: 4px 8px; border: 1px solid #30363d; border-radius: 3px; transition: all 0.2s; }
    .link-btn:hover { background: #1f6feb; border-color: #1f6feb; color: #fff; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; }
    .modal.active { display: flex; align-items: center; justify-content: center; }
    .modal-content { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; width: 90%; max-width: 900px; max-height: 80vh; display: flex; flex-direction: column; }
    .modal-header { padding: 20px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
    .modal-close { background: none; border: none; color: #c9d1d9; font-size: 20px; cursor: pointer; }
    .modal-body { display: flex; flex: 1; overflow: hidden; }
    .project-details { flex: 1; padding: 20px; overflow-y: auto; border-right: 1px solid #30363d; }
    .project-chat { flex: 1; padding: 20px; display: flex; flex-direction: column; overflow: hidden; }
    .detail-field { margin-bottom: 20px; }
    .detail-label { font-size: 12px; color: #8b949e; text-transform: uppercase; margin-bottom: 4px; }
    .detail-value { font-size: 14px; color: #c9d1d9; }
    .chat-messages { flex: 1; overflow-y: auto; margin-bottom: 16px; display: flex; flex-direction: column; gap: 12px; padding-right: 8px; }
    .message { padding: 12px; border-radius: 6px; font-size: 13px; line-height: 1.4; }
    .message.user { background: #238636; align-self: flex-end; max-width: 80%; }
    .message.assistant { background: #1f6feb; align-self: flex-start; max-width: 80%; }
    .chat-input { display: flex; gap: 8px; }
    .chat-input input { flex: 1; background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
    .chat-input button { background: #238636; border: none; color: #fff; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .chat-input button:hover { background: #2ea043; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Projects</h1>
      <p style="color: #8b949e; margin-top: 4px;">All your projects, ideas & ventures in one place</p>
    </div>

    <div class="filters">
      <button class="filter-btn active" onclick="filterBy('all')">All</button>
      <button class="filter-btn" onclick="filterBy('active')">Active</button>
      <button class="filter-btn" onclick="filterBy('legacy')">Legacy</button>
      <button class="filter-btn" onclick="filterBy('idea')">Ideas</button>
    </div>

    <div class="projects-grid" id="projectsGrid"></div>
  </div>

  <div class="modal" id="projectModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle"></h2>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="project-details" id="projectDetails"></div>
        <div class="project-chat">
          <div class="chat-messages" id="chatMessages"></div>
          <div class="chat-input">
            <input type="text" id="chatInput" placeholder="Tell Falkor to make edits..." onkeypress="handleChatKey(event)">
            <button onclick="sendChat()">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentFilter = 'all';
    let currentProject = null;
    let projects = ${JSON.stringify(PROJECTS_DATA)};

    async function init() {
      renderProjects();
    }

    function renderProjects() {
      const filtered = currentFilter === 'all'
        ? projects
        : projects.filter(p => p.type === currentFilter);

      const grid = document.getElementById('projectsGrid');
      grid.innerHTML = filtered.map(p => \`
        <div class="project-card" onclick="openProject('\${p.id}')">
          <div class="project-status status-\${p.status}">\${p.status.toUpperCase()}</div>
          <div class="project-name">\${p.name}</div>
          <div class="project-desc">\${p.description}</div>
          <div class="project-links">
            \${p.url ? \`<a href="\${p.url}" class="link-btn" target="_blank" onclick="event.stopPropagation()">🌐 Live</a>\` : ''}
            \${p.repo ? \`<a href="https://github.com/\${p.repo}" class="link-btn" target="_blank" onclick="event.stopPropagation()">📦 GitHub</a>\` : ''}
          </div>
        </div>
      \`).join('');
    }

    function filterBy(type) {
      currentFilter = type;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      renderProjects();
    }

    function openProject(id) {
      currentProject = projects.find(p => p.id === id);
      if (!currentProject) return;

      document.getElementById('modalTitle').textContent = currentProject.name;
      document.getElementById('projectDetails').innerHTML = \`
        <div class="detail-field">
          <div class="detail-label">Status</div>
          <div class="detail-value">\${currentProject.status.toUpperCase()}</div>
        </div>
        <div class="detail-field">
          <div class="detail-label">Category</div>
          <div class="detail-value">\${currentProject.category}</div>
        </div>
        <div class="detail-field">
          <div class="detail-label">Description</div>
          <div class="detail-value">\${currentProject.description}</div>
        </div>
        \${currentProject.url ? \`
        <div class="detail-field">
          <div class="detail-label">Live URL</div>
          <div class="detail-value"><a href="\${currentProject.url}" target="_blank" style="color: #58a6ff;">\${currentProject.url}</a></div>
        </div>
        \` : ''}
        \${currentProject.repo ? \`
        <div class="detail-field">
          <div class="detail-label">Repository</div>
          <div class="detail-value"><a href="https://github.com/\${currentProject.repo}" target="_blank" style="color: #58a6ff;">github.com/\${currentProject.repo}</a></div>
        </div>
        \` : ''}
      \`;

      document.getElementById('chatMessages').innerHTML = \`
        <div class="message assistant">👋 Hi Paddy! What would you like to do with \${currentProject.name}?</div>
      \`;
      document.getElementById('chatInput').value = '';

      document.getElementById('projectModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('projectModal').classList.remove('active');
      currentProject = null;
    }

    function handleChatKey(e) {
      if (e.key === 'Enter') sendChat();
    }

    async function sendChat() {
      const input = document.getElementById('chatInput');
      const msg = input.value.trim();
      if (!msg) return;

      const messages = document.getElementById('chatMessages');
      messages.innerHTML += \`<div class="message user">\${msg}</div>\`;
      input.value = '';
      messages.scrollTop = messages.scrollHeight;

      // Send to Falkor
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pin': '${pin}' },
          body: JSON.stringify({ projectId: currentProject.id, message: msg })
        });
        const data = await res.json();
        if (data.ok) {
          messages.innerHTML += \`<div class="message assistant">\${data.response}</div>\`;
          messages.scrollTop = messages.scrollHeight;
        }
      } catch (e) {
        messages.innerHTML += \`<div class="message assistant">⚠️ Error: \${e.message}</div>\`;
      }
    }

    init();
  </script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleGetProjects(env) {
  return new Response(JSON.stringify({ ok: true, projects: PROJECTS_DATA }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetProject(env, id) {
  const project = PROJECTS_DATA.find(p => p.id === id);
  return new Response(JSON.stringify({ ok: !!project, project }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleChat(request, env, pin) {
  // This will route natural language commands to Falkor
  const { projectId, message } = await request.json();

  // TODO: Integrate with Falkor agent
  // For now, return a placeholder response
  return new Response(JSON.stringify({
    ok: true,
    response: `📝 Ready to edit ${projectId}. Message: "${message}". (Falkor integration pending)`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleEditProject(request, env, pin) {
  const { projectId, updates } = await request.json();

  // TODO: Update project in D1 database
  return new Response(JSON.stringify({
    ok: true,
    message: 'Project updated'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
