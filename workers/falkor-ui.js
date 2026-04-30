export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({status:'ok',version:'1.2.0',worker:'falkor-ui'}), {
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      });
    }
    const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Falkor</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
<style>
:root{--bg:#0f0f11;--panel:#18181b;--border:#2a2a2e;--text:#e8e8ea;--muted:#888;--accent:#6c63ff;--accent2:#a78bfa;--user-bubble:#1e1e2e;--ai-bubble:#18181b;--danger:#ef4444;--success:#22c55e;--input-bg:#1a1a1f;--radius:12px}
[data-theme="light"]{--bg:#f5f5f7;--panel:#fff;--border:#e0e0e5;--text:#1a1a1e;--muted:#666;--user-bubble:#ede9fe;--ai-bubble:#fff;--input-bg:#fff}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;height:100dvh;overflow:hidden}
.login-wrap{display:flex;align-items:center;justify-content:center;height:100dvh}
.login-card{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:40px 36px;width:100%;max-width:380px}
.login-logo{font-size:28px;font-weight:700;letter-spacing:-1px;margin-bottom:6px}
.login-sub{color:var(--muted);font-size:14px;margin-bottom:28px}
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.field label{font-size:13px;color:var(--muted)}
.field input{background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:15px;padding:10px 14px;outline:none;transition:border .15s}
.field input:focus{border-color:var(--accent)}
.btn{background:var(--accent);border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:15px;font-weight:600;padding:11px 20px;width:100%;transition:opacity .15s}
.btn:hover{opacity:.88}.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-ghost:hover{background:var(--border);opacity:1}
.err-msg{color:var(--danger);font-size:13px;margin-bottom:12px}
.app{display:flex;height:100dvh}
.sidebar{width:260px;min-width:260px;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:transform .2s}
.sidebar-top{padding:16px 12px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.logo-text{font-size:18px;font-weight:700;flex:1}
.icon-btn{background:none;border:none;color:var(--muted);cursor:pointer;padding:6px;border-radius:6px;font-size:18px;line-height:1}
.icon-btn:hover{background:var(--border);color:var(--text)}
.new-chat-btn{margin:10px 12px}
.convo-list{flex:1;overflow-y:auto;padding:4px 0}
.convo-item{padding:10px 14px;cursor:pointer;border-radius:8px;margin:2px 6px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text);display:flex;align-items:center;gap:6px}
.convo-item:hover{background:var(--border)}
.convo-item.active{background:rgba(108,99,255,.18);color:var(--accent2)}
.convo-del{margin-left:auto;opacity:0;font-size:11px;color:var(--danger)}
.convo-item:hover .convo-del{opacity:.7}
.convo-del:hover{opacity:1!important}
.sidebar-footer{padding:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px}
.user-pill{background:var(--border);border-radius:20px;font-size:12px;padding:5px 12px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;gap:10px;min-height:52px}
.model-select{background:var(--input-bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;padding:5px 10px;cursor:pointer}
.topbar-title{font-size:14px;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ws-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);flex-shrink:0}
.ws-dot.connected{background:var(--success)}.ws-dot.connecting{background:#f59e0b}
.messages{flex:1;overflow-y:auto;padding:20px 0;scroll-behavior:smooth}
.msg-row{padding:6px 20px;display:flex;flex-direction:column;gap:2px}
.msg-row.user{align-items:flex-end}.msg-row.assistant{align-items:flex-start}
.msg-bubble{max-width:78%;background:var(--user-bubble);border-radius:14px;padding:10px 14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word}
.msg-row.assistant .msg-bubble{background:var(--ai-bubble);border:1px solid var(--border)}
.msg-role{font-size:11px;color:var(--muted);margin-bottom:2px;padding:0 4px}
.typing-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--muted);animation:bounce .9s infinite;margin:0 2px}
.typing-dot:nth-child(2){animation-delay:.2s}.typing-dot:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
.composer{padding:14px 16px;border-top:1px solid var(--border);background:var(--bg)}
.composer-inner{display:flex;gap:8px;align-items:flex-end;background:var(--input-bg);border:1px solid var(--border);border-radius:12px;padding:8px 12px;transition:border .15s}
.composer-inner:focus-within{border-color:var(--accent)}
.composer-inner.drag-over{border-color:var(--accent2);background:rgba(108,99,255,.08)}
textarea{background:none;border:none;color:var(--text);flex:1;font-size:14px;line-height:1.5;outline:none;resize:none;max-height:160px;font-family:inherit}
.send-btn{background:var(--accent);border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:16px;padding:7px 12px;transition:opacity .15s;flex-shrink:0;line-height:1}
.send-btn:hover{opacity:.85}.send-btn:disabled{opacity:.35;cursor:not-allowed}
.attach-row{font-size:12px;color:var(--accent2);padding:4px 4px 0;display:flex;align-items:center;gap:8px}
.attach-remove{color:var(--danger);cursor:pointer}
.empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;opacity:.55}
.empty-icon{font-size:48px}.empty-title{font-size:18px;font-weight:600}.empty-sub{font-size:13px;color:var(--muted)}
.settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center}
.settings-panel{background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:28px;width:100%;max-width:420px;display:flex;flex-direction:column;gap:18px;max-height:80dvh;overflow-y:auto}
.settings-title{font-size:17px;font-weight:700}
.setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.setting-label{font-size:14px}.setting-val{font-size:13px;color:var(--muted);background:var(--input-bg);border:1px solid var(--border);border-radius:6px;padding:4px 10px}
.toggle{width:40px;height:22px;background:var(--border);border-radius:11px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
.toggle.on{background:var(--accent)}.toggle::after{content:'';position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:3px;left:3px;transition:left .2s}.toggle.on::after{left:21px}
.divider{border:none;border-top:1px solid var(--border)}
.sidebar-scrim{display:none}
@media(max-width:640px){.sidebar{position:fixed;inset:0 auto 0 0;z-index:50;transform:translateX(-100%)}.sidebar.open{transform:none}.sidebar-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:49}}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.msg-bubble code{background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px;font-size:12px;font-family:monospace}
.msg-bubble pre{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin:8px 0;overflow-x:auto}
.msg-bubble pre code{background:none;padding:0;font-size:12px}
.sport-table{width:100%;border-collapse:collapse;font-size:13px}
.sport-table th{text-align:left;padding:6px 8px;color:var(--muted);border-bottom:1px solid var(--border)}
.sport-table td{padding:7px 8px;border-bottom:1px solid var(--border)}
/* ── Voice ── */
.voice-overlay{position:fixed;inset:0;background:rgba(10,10,14,.92);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;backdrop-filter:blur(6px)}
.voice-dragon{font-size:64px;line-height:1;filter:drop-shadow(0 0 24px rgba(108,99,255,.6))}
.voice-status{font-size:15px;color:var(--accent2);letter-spacing:.03em;min-height:22px}
.voice-transcript{font-size:14px;color:var(--muted);max-width:500px;text-align:center;min-height:40px;line-height:1.5;padding:0 24px}
.voice-reply{font-size:14px;color:var(--text);max-width:500px;text-align:center;min-height:40px;line-height:1.5;padding:0 24px}
.waveform{display:flex;align-items:center;gap:3px;height:48px}
.waveform-bar{width:4px;background:var(--accent);border-radius:2px;transition:height .1s ease;min-height:4px}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.6);opacity:0}}
.voice-mic-btn{width:72px;height:72px;border-radius:50%;border:none;cursor:pointer;font-size:28px;position:relative;display:flex;align-items:center;justify-content:center;transition:background .2s}
.voice-mic-btn.idle{background:var(--accent)}
.voice-mic-btn.listening{background:#ef4444}
.voice-mic-btn.listening::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:2px solid #ef4444;animation:pulse-ring .9s ease-out infinite}
.voice-mic-btn.processing{background:var(--border);cursor:not-allowed}
.voice-mic-btn.speaking{background:var(--success)}
.voice-close{position:absolute;top:24px;right:24px;background:none;border:none;color:var(--muted);font-size:24px;cursor:pointer;padding:8px}
.voice-close:hover{color:var(--text)}
.voice-btn{background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:4px 6px;border-radius:6px;line-height:1;transition:color .15s}
.voice-btn:hover{color:var(--accent2)}
.voice-btn.active{color:var(--accent)}
/* ── Toast ── */
.toast-container{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:300;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}
.toast{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:10px 18px;font-size:13px;color:var(--text);box-shadow:0 4px 20px rgba(0,0,0,.4);animation:toast-in .2s ease;max-width:360px;text-align:center}
@keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState, useEffect, useRef, useCallback } = React;

const AGENT_URL = 'https://falkor-agent.luckdragon.io';
const SPORT_URL = 'https://falkor-sport.luckdragon.io';
const AUTH_URL  = 'https://asgard.luckdragon.io';
const AI_URL    = 'https://asgard-ai.luckdragon.io';
const MODELS = [
  { key: 'groq-fast',  label: '⚡ Groq Fast' },
  { key: 'groq',       label: '🧠 Groq 70B' },
  { key: 'groq-think', label: '🔍 Groq Think' },
  { key: 'haiku',      label: '🌸 Haiku' },
  { key: 'sonnet',     label: '✨ Sonnet' },
];
const LS = {
  pin:    () => localStorage.getItem('falkor.pin') || '',
  setPin: v  => localStorage.setItem('falkor.pin', v),
  convos: () => { try { return JSON.parse(localStorage.getItem('falkor.convos') || '[]'); } catch { return []; } },
  setConvos: v => localStorage.setItem('falkor.convos', JSON.stringify(v)),
  model:  () => localStorage.getItem('falkor.model') || 'groq-fast',
  setModel: v => localStorage.setItem('falkor.model', v),
  theme:  () => localStorage.getItem('falkor.theme') || 'dark',
  setTheme: v => localStorage.setItem('falkor.theme', v),
  voice:  () => localStorage.getItem('falkor.voice') !== 'off',
  setVoice: v => localStorage.setItem('falkor.voice', v ? 'on' : 'off'),
};
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function renderMD(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g,'<pre><code>$1</code></pre>')
    .replace(/\`([^\`]+)\`/g,'<code>$1</code>')
    .replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>')
    .replace(/\\*([^*]+)\\*/g,'<em>$1</em>')
    .replace(/\\n/g,'<br>');
}

// ── Toast ──────────────────────────────────────────────────────
let _toastId = 0;
let _setToasts = null;
function toast(msg, duration) {
  if (!_setToasts) return;
  var d = duration || 3000;
  var id = ++_toastId;
  _setToasts(function(prev) { return prev.concat([{ id: id, msg: msg }]); });
  setTimeout(function() { _setToasts(function(prev) { return prev.filter(function(t) { return t.id !== id; }); }); }, d);
}
function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
}

// ── Voice Waveform ─────────────────────────────────────────────
function VoiceWaveform({ analyserRef, active }) {
  const barsRef = useRef([]);
  const rafRef = useRef(null);
  const NUM_BARS = 18;

  useEffect(() => {
    if (!active || !analyserRef.current) {
      barsRef.current.forEach(b => { if(b) b.style.height = '4px'; });
      return;
    }
    const analyser = analyserRef.current;
    const data = new Uint8Array(analyser.frequencyBinCount);
    function draw() {
      analyser.getByteFrequencyData(data);
      const step = Math.floor(data.length / NUM_BARS);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const v = data[i * step] / 255;
        bar.style.height = Math.max(4, v * 44) + 'px';
      });
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <div className="waveform">
      {Array.from({length: NUM_BARS}, (_, i) => (
        <div key={i} className="waveform-bar" ref={el => barsRef.current[i] = el} style={{height:'4px'}}/>
      ))}
    </div>
  );
}

// ── Voice Modal ────────────────────────────────────────────────
function VoiceModal({ voiceState, transcript, reply, analyserRef, onMicClick, onClose }) {
  const statusMap = {
    idle:       '🎙️ Tap mic to speak',
    listening:  '🔴 Listening…',
    processing: '⚙️ Processing…',
    speaking:   '🔊 Speaking…',
  };
  return (
    <div className="voice-overlay">
      <button className="voice-close" onClick={onClose}>✕</button>
      <div className="voice-dragon">🐉</div>
      <div className="voice-status">{statusMap[voiceState] || ''}</div>
      <VoiceWaveform analyserRef={analyserRef} active={voiceState==='listening'||voiceState==='speaking'} />
      {transcript && <div className="voice-transcript">"{transcript}"</div>}
      {reply && <div className="voice-reply">{reply}</div>}
      <button
        className={'voice-mic-btn ' + voiceState}
        onClick={onMicClick}
        disabled={voiceState==='processing'||voiceState==='speaking'}
      >
        {voiceState==='listening' ? '⏹' : voiceState==='speaking' ? '🔊' : '🎤'}
      </button>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await fetch(\`\${AUTH_URL}/login\`, {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:\`email=\${encodeURIComponent(email)}&password=\${encodeURIComponent(password)}\`,
        redirect:'manual', credentials:'include',
      });
      const test = await fetch(\`\${AGENT_URL}/status\`, { headers:{'X-Pin':'535554'} }).catch(()=>null);
      if (test && test.ok) { LS.setPin('535554'); onLogin({ email, name: email.split('@')[0] }); }
      else setError('Incorrect email or password.');
    } catch { setError('Connection error. Try again.'); }
    setLoading(false);
  }
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">🐉 Falkor</div>
        <div className="login-sub">Your personal AI assistant</div>
        {error && <div className="err-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoFocus /></div>
          <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────
function SettingsPanel({ onClose, theme, onThemeToggle, voiceEnabled, onVoiceToggle }) {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    fetch(\`\${AGENT_URL}/status\`,{headers:{'X-Pin':LS.pin()}}).then(r=>r.json()).then(setStatus).catch(()=>{});
  }, []);
  return (
    <div className="settings-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="settings-panel">
        <div className="settings-title">⚙️ Settings</div>
        <hr className="divider"/>
        <div className="setting-row"><span className="setting-label">Theme (light)</span><div className={\`toggle \${theme==='light'?'on':''}\`} onClick={onThemeToggle}/></div>
        <div className="setting-row"><span className="setting-label">🎙️ Voice replies</span><div className={\`toggle \${voiceEnabled?'on':''}\`} onClick={onVoiceToggle}/></div>
        <div className="setting-row"><span className="setting-label" style={{fontSize:12,color:'var(--muted)'}}>Say "Hey Falkor" to activate voice</span></div>
        <hr className="divider"/>
        <div className="setting-row"><span className="setting-label">Agent</span><span className="setting-val">falkor-agent.luckdragon.io</span></div>
        {status&&<><div className="setting-row"><span className="setting-label">Version</span><span className="setting-val">v{status.version}</span></div>
        <div className="setting-row"><span className="setting-label">History</span><span className="setting-val">{status.historyLength} msgs</span></div>
        <div className="setting-row"><span className="setting-label">Memory</span><span className="setting-val">{status.memoryKeys} keys</span></div></>}
        <hr className="divider"/>
        <button className="btn btn-ghost" onClick={()=>{if(confirm('Clear chat history?'))fetch(\`\${AGENT_URL}/history\`,{method:'DELETE',headers:{'X-Pin':LS.pin()}});onClose();}}>Clear history</button>
        <button className="btn" style={{background:'var(--danger)'}} onClick={()=>{localStorage.removeItem('falkor.pin');localStorage.removeItem('falkor.user');window.location.reload();}}>Sign out</button>
      </div>
    </div>
  );
}

// ── Sport Panel ────────────────────────────────────────────────
function SportPanel({ pin }) {
  const [ladder,setLadder]=useState(null);
  const [games,setGames]=useState([]);
  const [tips,setTips]=useState([]);
  const [comp,setComp]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState('ladder');
  const [rnd,setRnd]=useState(8);
  const [player,setPlayer]=useState(()=>localStorage.getItem('falkor.sport.player')||'');
  const [tipped,setTipped]=useState({});
  const YEAR=2026;

  async function sf(path) {
    const res=await fetch(\`\${SPORT_URL}\${path}\${path.includes('?')?'&':'?'}pin=\${pin}\`);
    return res.json();
  }
  async function load() {
    setLoading(true);
    const [l,g,t,c]=await Promise.allSettled([
      sf(\`/afl/ladder?year=\${YEAR}\`),
      sf(\`/afl/round?year=\${YEAR}&round=\${rnd}\`),
      sf(\`/afl/tips?year=\${YEAR}&round=\${rnd}\`),
      sf(\`/afl/comp?year=\${YEAR}&round=\${rnd}\`),
    ]);
    if(l.status==='fulfilled')setLadder(l.value);
    if(g.status==='fulfilled')setGames(g.value);
    if(t.status==='fulfilled')setTips(t.value);
    if(c.status==='fulfilled')setComp(c.value);
    setLoading(false);
  }
  useEffect(()=>{load();},[rnd]);

  async function tip(gameId,team) {
    if(!player){alert('Enter your name first');return;}
    localStorage.setItem('falkor.sport.player',player);
    await fetch(\`\${SPORT_URL}/afl/comp/tip?pin=\${pin}\`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({player,round:rnd,gameId,tip:team}),
    });
    setTipped(p=>({...p,[gameId]:team}));
    setTimeout(load,500);
  }

  const TB = (t) => ({
    padding:'6px 14px',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px',
    background:tab===t?'var(--accent)':'var(--border)',
    color:tab===t?'#fff':'var(--text)',marginRight:'4px',
  });

  return (
    <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
        <span style={{fontSize:'18px',fontWeight:700}}>🏈 AFL {YEAR}</span>
        <span style={{color:'var(--muted)',fontSize:'13px'}}>Round</span>
        <select value={rnd} onChange={e=>setRnd(Number(e.target.value))}
          style={{background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text)',padding:'4px 8px',fontSize:'13px'}}>
          {Array.from({length:24},(_,i)=>i+1).map(r=><option key={r} value={r}>R{r}</option>)}
        </select>
        <button onClick={load} style={{...TB('x'),background:'var(--border)',color:'var(--text)'}}>↻</button>
        <div style={{marginLeft:'auto'}}>
          {['ladder','results','tips','comp'].map(t=><button key={t} style={TB(t)} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
        </div>
      </div>

      {loading && <div style={{color:'var(--muted)',fontSize:'13px',padding:'20px'}}>Loading…</div>}

      {!loading && tab==='ladder' && ladder && (
        <table className="sport-table">
          <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>D</th><th>Pts</th><th>%</th></tr></thead>
          <tbody>{ladder.map((t,i)=>(
            <tr key={t.team} style={{background:i<8?'rgba(108,99,255,.05)':'transparent'}}>
              <td style={{color:'var(--muted)'}}>{t.rank}</td>
              <td style={{fontWeight:i<8?600:400}}>{t.team}</td>
              <td style={{textAlign:'center',color:'var(--success)'}}>{t.wins}</td>
              <td style={{textAlign:'center',color:'var(--danger)'}}>{t.losses}</td>
              <td style={{textAlign:'center',color:'var(--muted)'}}>{t.draws}</td>
              <td style={{textAlign:'center',fontWeight:600}}>{t.points}</td>
              <td style={{textAlign:'center',color:'var(--muted)'}}>{t.percentage}%</td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {!loading && tab==='results' && (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {games.map(g=>(
            <div key={g.id} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'10px',padding:'12px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',justifyContent:'space-between',flexWrap:'wrap'}}>
                <div style={{display:'flex',gap:'12px',alignItems:'center',flex:1}}>
                  <span style={{fontWeight:g.winner===g.home?700:400,flex:1,textAlign:'right'}}>{g.home}</span>
                  <span style={{color:'var(--muted)',fontSize:'12px',flexShrink:0}}>{g.status==='upcoming'?'vs':\`\${g.homeScore} – \${g.awayScore}\`}</span>
                  <span style={{fontWeight:g.winner===g.away?700:400,flex:1}}>{g.away}</span>
                </div>
                <span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'20px',flexShrink:0,
                  background:g.status==='final'?'rgba(34,197,94,.15)':g.status==='live'?'rgba(245,158,11,.15)':'var(--border)',
                  color:g.status==='final'?'var(--success)':g.status==='live'?'#f59e0b':'var(--muted)'}}>
                  {g.status==='final'?'Final':g.status==='live'?'LIVE':g.date?.slice(0,10)||'TBC'}
                </span>
              </div>
              {g.venue&&<div style={{fontSize:'11px',color:'var(--muted)',marginTop:'4px'}}>📍 {g.venue}</div>}
            </div>
          ))}
        </div>
      )}

      {!loading && tab==='tips' && (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          <div style={{fontSize:'12px',color:'var(--muted)',marginBottom:'4px'}}>AI model tips — Round {rnd} (Squiggle)</div>
          {tips.length===0&&<div style={{color:'var(--muted)',fontSize:'13px'}}>No tips available yet for Round {rnd}</div>}
          {tips.map((t,i)=>(
            <div key={i} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'10px',padding:'12px 16px',display:'flex',alignItems:'center',gap:'12px'}}>
              <span style={{fontWeight:600,flex:1}}>{t.tip}</span>
              <span style={{color:'var(--muted)',fontSize:'12px'}}>vs {t.opponent}</span>
              <span style={{background:'var(--border)',borderRadius:'20px',padding:'3px 10px',fontSize:'12px',
                color:t.confidence>70?'var(--success)':t.confidence>55?'#f59e0b':'var(--danger)'}}>
                {t.confidence}%
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && tab==='comp' && (
        <div>
          <div style={{marginBottom:'16px',display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <input value={player} onChange={e=>setPlayer(e.target.value)} onBlur={()=>localStorage.setItem('falkor.sport.player',player)}
              placeholder="Your name" style={{background:'var(--input-bg)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',padding:'7px 12px',fontSize:'13px',width:'160px'}}/>
            <span style={{fontSize:'12px',color:'var(--muted)'}}>Tip Round {rnd} winners</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
            {games.map(g=>{
              const myTip = tipped[g.id] || comp?.players?.[player]?.tips?.find(t=>t.gameId===String(g.id))?.tip;
              const done = g.status==='final';
              return (
                <div key={g.id} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'10px',padding:'12px 16px'}}>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                    {[g.home,g.away].map((team)=>(
                      <button key={team} onClick={()=>!done&&tip(String(g.id),team)}
                        style={{flex:1,padding:'8px',borderRadius:'8px',cursor:done?'default':'pointer',fontSize:'13px',
                          border:\`2px solid \${myTip===team?'var(--accent)':'var(--border)'}\`,
                          background:myTip===team?'rgba(108,99,255,.15)':'var(--input-bg)',
                          color:'var(--text)',fontWeight:myTip===team?700:400}}>
                        {team}
                      </button>
                    )).reduce((acc,el,i)=>i===0?[el]:[...acc,<span key="v" style={{color:'var(--muted)',fontSize:'12px',flexShrink:0}}>vs</span>,el],[])}
                    {done&&myTip&&<span style={{fontSize:'13px',flexShrink:0,color:g.winner===myTip?'var(--success)':'var(--danger)'}}>{g.winner===myTip?'✓':'✗'}</span>}
                  </div>
                  {done&&<div style={{fontSize:'11px',color:'var(--muted)',marginTop:'4px'}}>Final: {g.home} {g.homeScore} – {g.awayScore} {g.away}</div>}
                </div>
              );
            })}
          </div>
          {comp?.season?.length>0&&(
            <div>
              <div style={{fontWeight:600,marginBottom:'10px',fontSize:'14px'}}>🏆 Season {YEAR} Leaderboard</div>
              <table className="sport-table">
                <thead><tr><th>#</th><th>Player</th><th style={{textAlign:'center'}}>Correct</th><th style={{textAlign:'center'}}>Total</th><th style={{textAlign:'center'}}>%</th></tr></thead>
                <tbody>{comp.season.map((p,i)=>(
                  <tr key={p.player}>
                    <td style={{color:'var(--muted)'}}>{i+1}</td>
                    <td style={{fontWeight:p.player===player?700:400}}>{p.player}{p.player===player?' 👤':''}</td>
                    <td style={{textAlign:'center',color:'var(--success)'}}>{p.correct}</td>
                    <td style={{textAlign:'center'}}>{p.total}</td>
                    <td style={{textAlign:'center',color:'var(--muted)'}}>{p.pct}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {comp?.season?.length===0&&<div style={{color:'var(--muted)',fontSize:'13px'}}>No tips submitted yet — be the first!</div>}
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────
function MessageBubble({msg}){
  return(
    <div className={\`msg-row \${msg.role}\`}>
      <div className="msg-role">{msg.role==='user'?'You':'🐉 Falkor'}</div>
      <div className="msg-bubble" dangerouslySetInnerHTML={{__html:renderMD(msg.content)}}/>
    </div>
  );
}
function TypingIndicator(){
  return(
    <div className="msg-row assistant">
      <div className="msg-role">🐉 Falkor</div>
      <div className="msg-bubble" style={{padding:'12px 16px'}}>
        <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────
function App(){
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('falkor.user')||'null')}catch{return null}});
  const [view,setView]=useState('chat');
  const [convos,setConvos]=useState(LS.convos);
  const [activeId,setActiveId]=useState(()=>localStorage.getItem('falkor.activeId')||'');
  const [model,setModelS]=useState(LS.model);
  const [theme,setThemeS]=useState(LS.theme);
  const [input,setInput]=useState('');
  const [typing,setTyping]=useState(false);
  const [wsState,setWsState]=useState('disconnected');
  const [showSettings,setShowSettings]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [attachment,setAttachment]=useState(null);
  const [dragOver,setDragOver]=useState(false);
  const [voiceEnabled,setVoiceEnabledS]=useState(LS.voice);
  const [showVoice,setShowVoice]=useState(false);
  const [voiceState,setVoiceState]=useState('idle');
  const [voiceTranscript,setVoiceTranscript]=useState('');
  const [voiceReply,setVoiceReply]=useState('');
  const analyserRef=useRef(null);
  const audioCtxRef=useRef(null);
  const mediaRecorderRef=useRef(null);
  const chunksRef=useRef([]);
  const silenceTimerRef=useRef(null);
  const wsRef=useRef(null);
  const endRef=useRef(null);
  const taRef=useRef(null);
  const reconnTimer=useRef(null);
  const activeConvo=convos.find(c=>c.id===activeId);
  const voiceEnabledRef=useRef(voiceEnabled);
  const showVoiceRef=useRef(showVoice);
  useEffect(()=>{voiceEnabledRef.current=voiceEnabled;},[voiceEnabled]);
  useEffect(()=>{showVoiceRef.current=showVoice;},[showVoice]);

  useEffect(()=>{document.documentElement.setAttribute('data-theme',theme);LS.setTheme(theme);},[theme]);
  useEffect(()=>{LS.setConvos(convos);},[convos]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[activeConvo?.messages,typing]);

  const connectWS=useCallback(()=>{
    if(!user||!LS.pin())return;
    if(wsRef.current&&wsRef.current.readyState<2)return;
    setWsState('connecting');
    const ws=new WebSocket(AGENT_URL.replace('https://','wss://')+\`/?pin=\${LS.pin()}\`);
    wsRef.current=ws;
    ws.onopen=()=>{setWsState('connected');clearTimeout(reconnTimer.current);};
    ws.onmessage=(evt)=>{
      try{
        const msg=JSON.parse(evt.data);
        if(msg.type==='assistant_reply'){
          setTyping(false);
          const m={id:uid(),role:'assistant',content:msg.text,ts:Date.now()};
          setConvos(prev=>prev.map(c=>c.id===activeId?{...c,messages:[...(c.messages||[]),m]}:c));
          if(voiceEnabledRef.current && !showVoiceRef.current) speakText(msg.text);
        }
      }catch{}
    };
    ws.onclose=()=>{setWsState('disconnected');setTyping(false);reconnTimer.current=setTimeout(connectWS,3000);};
    ws.onerror=()=>ws.close();
  },[user,activeId]);

  useEffect(()=>{if(user)connectWS();return()=>{clearTimeout(reconnTimer.current);wsRef.current?.close();};},[user]);
  useEffect(()=>{localStorage.setItem('falkor.activeId',activeId);},[activeId]);

  // Wake word
  useE`;
    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  }
};
