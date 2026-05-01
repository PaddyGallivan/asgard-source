// falkor-widget v1.0.0 — embeddable Falkor chat widget
// Serves /widget.js (embeddable script) and /chat (PIN-authenticated proxy to falkor-agent)

const AGENT_URL = 'https://falkor-agent.luckdragon.io';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// The embeddable widget JS — injected into any page via <script src=...>
// Reads data-product attribute from the script tag for context
function buildWidgetJs() {
  return `
(function() {
  if (window.__falkorWidget) return;
  window.__falkorWidget = true;

  var WIDGET_URL = 'https://falkor-widget.luckdragon.io';
  var scriptTag = document.currentScript || (function(){ var s = document.getElementsByTagName('script'); return s[s.length-1]; })();
  var product = (scriptTag && scriptTag.getAttribute('data-product')) || 'this app';

  // ── Styles ─────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#fk-btn { position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%;',
    '  background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff; font-size:26px;',
    '  border:none; cursor:pointer; box-shadow:0 4px 20px rgba(124,58,237,0.5);',
    '  z-index:99999; display:flex; align-items:center; justify-content:center;',
    '  transition:transform 0.2s; }',
    '#fk-btn:hover { transform:scale(1.1); }',
    '#fk-panel { position:fixed; bottom:92px; right:24px; width:360px; height:520px;',
    '  background:#1a1a2e; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,0.6);',
    '  z-index:99998; display:none; flex-direction:column; overflow:hidden;',
    '  border:1px solid rgba(124,58,237,0.3); font-family:-apple-system,BlinkMacSystemFont,sans-serif; }',
    '#fk-panel.open { display:flex; }',
    '#fk-header { background:linear-gradient(135deg,#7c3aed,#4f46e5); padding:14px 16px;',
    '  display:flex; align-items:center; gap:10px; }',
    '#fk-header span { color:#fff; font-weight:700; font-size:15px; flex:1; }',
    '#fk-close { background:none; border:none; color:#fff; font-size:18px; cursor:pointer; padding:0; }',
    '#fk-messages { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; }',
    '#fk-messages::-webkit-scrollbar { width:4px; }',
    '#fk-messages::-webkit-scrollbar-track { background:transparent; }',
    '#fk-messages::-webkit-scrollbar-thumb { background:#7c3aed; border-radius:2px; }',
    '.fk-msg { max-width:82%; padding:10px 13px; border-radius:14px; font-size:13px; line-height:1.5; word-break:break-word; }',
    '.fk-msg.user { background:#7c3aed; color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }',
    '.fk-msg.bot { background:#2d2d4e; color:#e2e8f0; align-self:flex-start; border-bottom-left-radius:4px; }',
    '.fk-msg.thinking { color:#6b7280; font-style:italic; }',
    '#fk-input-row { padding:10px 12px; background:#111127; display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.07); }',
    '#fk-input { flex:1; background:#1e1e38; border:1px solid rgba(124,58,237,0.3); border-radius:10px;',
    '  color:#e2e8f0; padding:8px 12px; font-size:13px; outline:none; resize:none; max-height:80px; }',
    '#fk-input::placeholder { color:#4b5563; }',
    '#fk-send { background:#7c3aed; border:none; color:#fff; width:36px; height:36px; border-radius:10px;',
    '  cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;',
    '  flex-shrink:0; align-self:flex-end; transition:background 0.2s; }',
    '#fk-send:hover { background:#6d28d9; }',
    '#fk-powered { text-align:center; padding:4px; font-size:10px; color:#374151; background:#111127; }',
  ].join(' ');
  document.head.appendChild(style);

  // ── DOM ─────────────────────────────────────────────────────────────────
  var btn = document.createElement('button');
  btn.id = 'fk-btn';
  btn.title = 'Ask Falkor';
  btn.innerHTML = '🐉';

  var panel = document.createElement('div');
  panel.id = 'fk-panel';
  panel.innerHTML = [
    '<div id="fk-header">',
    '  <span>🐉 Falkor</span>',
    '  <button id="fk-close" title="Close">✕</button>',
    '</div>',
    '<div id="fk-messages"></div>',
    '<div id="fk-input-row">',
    '  <textarea id="fk-input" rows="1" placeholder="Ask Falkor anything..."></textarea>',
    '  <button id="fk-send">➤</button>',
    '</div>',
    '<div id="fk-powered">Powered by Falkor • luckdragon.io</div>',
  ].join('');

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgs = panel.querySelector('#fk-messages');
  var input = panel.querySelector('#fk-input');
  var sendBtn = panel.querySelector('#fk-send');
  var closeBtn = panel.querySelector('#fk-close');
  var open = false;
  var busy = false;

  function togglePanel() {
    open = !open;
    if (open) {
      panel.classList.add('open');
      btn.innerHTML = '✕';
      if (msgs.children.length === 0) addMsg('bot', 'Hey! 👋 I\'m Falkor. I can help you with anything on ' + product + ', or anything else. What\'s up?');
      setTimeout(function(){ input.focus(); }, 100);
    } else {
      panel.classList.remove('open');
      btn.innerHTML = '🐉';
    }
  }

  function addMsg(role, text) {
    var d = document.createElement('div');
    d.className = 'fk-msg ' + role;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function typeMsg(el, text, i) {
    if (i >= text.length) return;
    el.textContent = text.slice(0, i + 1);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(function(){ typeMsg(el, text, i + 1); }, 16);
  }

  async function send() {
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true;
    input.value = '';
    input.style.height = '';
    addMsg('user', text);
    var thinking = addMsg('bot thinking', '…');
    sendBtn.disabled = true;
    try {
      var r = await fetch(WIDGET_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, product: product }),
      });
      var d = await r.json();
      msgs.removeChild(thinking);
      var replyEl = addMsg('bot', '');
      typeMsg(replyEl, d.reply || 'Sorry, something went wrong.', 0);
    } catch(e) {
      thinking.textContent = 'Error: ' + e.message;
      thinking.classList.remove('thinking');
    }
    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  btn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  input.addEventListener('input', function() {
    input.style.height = '';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

})();
`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // ── Health ──────────────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', version: '1.0.0', worker: 'falkor-widget' });
    }

    // ── Widget JS ──────────────────────────────────────────────────────────
    if (url.pathname === '/widget.js') {
      return new Response(buildWidgetJs(), {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=300',
          ...CORS,
        },
      });
    }

    // ── Chat proxy — calls falkor-agent with PIN (never exposed to browser) ─
    if (url.pathname === '/chat' && request.method === 'POST') {
      try {
        const { text, product } = await request.json();
        if (!text || !text.trim()) {
          return new Response(JSON.stringify({ error: 'text required' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const pin = env.AGENT_PIN || '';
        const agentResp = await fetch(AGENT_URL + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pin': pin, 'X-User-Id': 'widget-' + (product || 'guest').replace(/\s+/g, '-').toLowerCase() },
          body: JSON.stringify({
            text: text.trim(),
            model: 'groq-fast',
            productContext: product || 'an external app',
          }),
        });
        if (!agentResp.ok) {
          const err = await agentResp.text().catch(() => 'unknown error');
          return new Response(JSON.stringify({ error: 'Agent error: ' + err }), {
            status: 502, headers: { 'Content-Type': 'application/json', ...CORS },
          });
        }
        const data = await agentResp.json();
        return new Response(JSON.stringify({ reply: data.reply || '' }), {
          headers: { 'Content-Type': 'application/json', ...CORS },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};