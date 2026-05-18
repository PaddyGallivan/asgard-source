// ../ct-worker.js
var HTML = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0d1117">
  <title>Carnival Timing</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --surface2: #21262d;
      --surface3: #30363d;
      --accent: #14b8a6;
      --accent2: #0891b2;
      --text: #f0f6fc;
      --muted: #8b949e;
      --success: #3fb950;
      --warn: #d29922;
      --danger: #f85149;
      --border: #30363d;
    }

    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      overflow-x: hidden;
    }

    /* \u2500\u2500 Screens \u2500\u2500 */
    .screen { display: none; min-height: 100vh; }
    .screen.active { display: block; }

    /* \u2500\u2500 Header \u2500\u2500 */
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--surface3);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo-badge {
      width: 30px; height: 30px;
      background: var(--accent);
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 900; color: #000;
      flex-shrink: 0;
      letter-spacing: -1px;
    }
    .header-title { font-weight: 700; font-size: 1rem; }
    .header-sub { font-size: 0.75rem; color: var(--muted); }
    .header-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .conn-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--muted); flex-shrink: 0;
    }
    .conn-dot.live { background: var(--success); box-shadow: 0 0 6px var(--success); }

    /* \u2500\u2500 Content \u2500\u2500 */
    .content { padding: 16px; }

    /* \u2500\u2500 Home Screen \u2500\u2500 */
    .home-hero {
      text-align: center;
      padding: 52px 24px 32px;
      background: linear-gradient(180deg, rgba(20,184,166,0.05) 0%, transparent 100%);
    }
    .home-logo {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
      border-radius: 22px;
      display: flex; align-items: center; justify-content: center;
      font-size: 34px; font-weight: 900; color: #000;
      margin: 0 auto 24px;
      box-shadow: 0 12px 40px rgba(20,184,166,0.35);
      letter-spacing: -2px;
    }
    .home-title {
      font-size: 2.2rem; font-weight: 900;
      background: linear-gradient(135deg, var(--accent) 0%, #67e8f9 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px; letter-spacing: -1px;
    }
    .home-tagline { color: var(--muted); font-size: 1rem; margin-bottom: 12px; }
    .home-sports {
      display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;
      margin-bottom: 36px;
    }
    .home-sport-pill {
      background: var(--surface2);
      border: 1px solid var(--surface3);
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .home-sport-pill span { margin-right: 5px; }

    /* \u2500\u2500 Buttons \u2500\u2500 */
    .btn {
      display: block; width: 100%;
      padding: 14px 20px;
      border: none; border-radius: 10px;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
      text-align: center; text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
    }
    .btn:active { transform: scale(0.97); }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-primary:hover { filter: brightness(0.9); }
    .btn-secondary {
      background: var(--surface2); color: var(--text);
      border: 1px solid var(--surface3);
    }
    .btn-secondary:hover { background: var(--surface3); }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-success { background: var(--success); color: #000; }
    .btn-go {
      background: var(--success); color: #000;
      font-size: 1.5rem; font-weight: 900;
      padding: 22px;
    }
    .btn-stop {
      background: var(--danger); color: #fff;
      font-size: 1.6rem; font-weight: 900;
      padding: 0; min-height: 130px;
      border-radius: 14px; border: none;
      cursor: pointer; width: 100%;
      -webkit-tap-highlight-color: transparent;
      transition: all 0.1s;
      font-family: inherit;
    }
    .btn-stop:active { transform: scale(0.97); }
    .btn-tap {
      background: var(--accent); color: #000;
      font-weight: 900; padding: 0;
      min-height: 220px; border-radius: 18px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px; width: 100%; border: none;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      transition: all 0.08s; user-select: none;
      font-family: inherit;
    }
    .btn-tap:active { transform: scale(0.96); filter: brightness(0.85); }
    .btn-tap .tap-main { font-size: 2.4rem; font-weight: 900; line-height: 1; }
    .btn-tap .tap-sub { font-size: 1rem; font-family: 'Menlo','SF Mono',monospace; opacity: 0.75; }
    .btn-sm { padding: 8px 14px; font-size: 0.85rem; width: auto; display: inline-block; }
    .btn-icon {
      background: var(--surface2); border: 1px solid var(--surface3);
      color: var(--text); padding: 8px 12px;
      width: auto; display: inline-flex; align-items: center; gap: 5px;
      font-size: 0.82rem; border-radius: 8px;
      font-family: inherit;
    }
    .btn[disabled] { opacity: 0.38; pointer-events: none; }

    /* \u2500\u2500 Form \u2500\u2500 */
    .form-group { margin-bottom: 16px; }
    label {
      display: block; font-size: 0.78rem; font-weight: 600;
      color: var(--muted); text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 6px;
    }
    input[type=text], input[type=number], select, textarea {
      width: 100%; background: var(--surface2);
      border: 1.5px solid var(--surface3); border-radius: 8px;
      color: var(--text); padding: 12px 14px;
      font-size: 1rem; font-family: inherit;
      outline: none; transition: border-color 0.15s;
    }
    input:focus, select:focus { border-color: var(--accent); }
    select option { background: var(--surface2); }

    /* \u2500\u2500 Sport Picker \u2500\u2500 */
    .sport-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .sport-btn {
      background: var(--surface2); border: 2px solid var(--surface3);
      border-radius: 12px; padding: 16px 12px;
      text-align: center; cursor: pointer;
      transition: all 0.15s; -webkit-tap-highlight-color: transparent;
    }
    .sport-btn.active { border-color: var(--accent); background: rgba(20,184,166,0.1); }
    .sport-btn .s-icon { font-size: 2.2rem; margin-bottom: 6px; }
    .sport-btn .s-label { font-size: 0.85rem; font-weight: 700; }
    .sport-btn .s-desc { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

    /* \u2500\u2500 Tier Pills \u2500\u2500 */
    .pill-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .pill {
      padding: 6px 14px; border-radius: 20px;
      border: 1.5px solid var(--surface3); background: var(--surface2);
      font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .pill.active { border-color: var(--accent); color: var(--accent); background: rgba(20,184,166,0.1); }

    /* \u2500\u2500 Card \u2500\u2500 */
    .card {
      background: var(--surface); border: 1px solid var(--surface3);
      border-radius: 12px; padding: 16px; margin-bottom: 12px;
    }
    .card-title {
      font-size: 0.73rem; font-weight: 700; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px;
    }

    /* \u2500\u2500 Badge \u2500\u2500 */
    .badge {
      display: inline-block; padding: 3px 9px;
      border-radius: 20px; font-size: 0.7rem;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .badge-live { background: rgba(63,185,80,0.15); color: var(--success); border: 1px solid rgba(63,185,80,0.3); }
    .badge-armed { background: rgba(210,153,34,0.15); color: var(--warn); border: 1px solid rgba(210,153,34,0.3); }
    .badge-idle { background: rgba(139,148,158,0.15); color: var(--muted); border: 1px solid rgba(139,148,158,0.2); }
    .badge-done { background: rgba(20,184,166,0.15); color: var(--accent); border: 1px solid rgba(20,184,166,0.3); }

    /* \u2500\u2500 Clock \u2500\u2500 */
    .clock {
      font-family: 'Menlo','SF Mono','Courier New',monospace;
      font-size: 4.2rem; font-weight: 700;
      letter-spacing: -3px; color: var(--accent);
      text-align: center; line-height: 1; padding: 14px 0;
    }
    .clock.stopped { color: var(--muted); }

    /* \u2500\u2500 Lane Row \u2500\u2500 */
    .lane-row {
      display: flex; align-items: center;
      padding: 10px 12px; background: var(--surface2);
      border-radius: 8px; margin-bottom: 6px; gap: 10px;
    }
    .lane-num {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--surface3);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
    }
    .lane-name { flex: 1; font-weight: 500; }
    .lane-time { font-family: 'Menlo',monospace; font-weight: 700; font-size: 1.05rem; }
    .conf-HIGH { color: var(--success); font-size: 0.7rem; }
    .conf-OK { color: var(--accent); font-size: 0.7rem; }
    .conf-CHECK { color: var(--warn); font-size: 0.7rem; }
    .conf-LOW { color: var(--danger); font-size: 0.7rem; }

    /* \u2500\u2500 Place Row (XC) \u2500\u2500 */
    .place-row {
      display: flex; align-items: center;
      padding: 10px 12px; background: var(--surface2);
      border-radius: 8px; margin-bottom: 6px; gap: 10px;
    }
    .medal {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.9rem; flex-shrink: 0;
    }
    .medal.p1 { background: #FFD700; color: #000; }
    .medal.p2 { background: #C0C0C0; color: #000; }
    .medal.p3 { background: #CD7F32; color: #fff; }
    .medal.pN { background: var(--surface3); color: var(--muted); }

    /* \u2500\u2500 Tap Counter \u2500\u2500 */
    .tap-counter { text-align: center; padding: 16px 0 8px; }
    .tap-place {
      font-size: 5.5rem; font-weight: 900; line-height: 1;
      color: var(--accent);
      font-family: 'Menlo','SF Mono',monospace;
    }
    .tap-label { font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }

    /* \u2500\u2500 Role Grid \u2500\u2500 */
    .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .role-card {
      background: var(--surface2); border: 2px solid var(--surface3);
      border-radius: 12px; padding: 20px 12px; text-align: center;
      cursor: pointer; transition: all 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .role-card:hover, .role-card:active { border-color: var(--accent); background: rgba(20,184,166,0.08); }
    .role-card .r-icon { font-size: 2.2rem; margin-bottom: 8px; }
    .role-card .r-label { font-weight: 700; font-size: 0.9rem; }
    .role-card .r-desc { font-size: 0.73rem; color: var(--muted); margin-top: 3px; }
    .role-card.full { grid-column: 1 / -1; }

    /* \u2500\u2500 Video Finish (slit camera) \u2500\u2500 */
    .vf-canvas  { width:100%; aspect-ratio:16/9; background:#111; border-radius:12px; display:block; touch-action:none; cursor:ew-resize; }
    .vf-slit-wrap { position:relative; overflow:hidden; border-radius:10px; border:1px solid var(--border); background:#000; margin-top:12px; }
    .vf-slit-display { width:100%; height:140px; display:block; background:#111; cursor:default; }
    .vf-mark-btn  { padding:6px 14px; font-size:0.8rem; border-radius:8px; background:var(--surface); border:1.5px solid var(--border); font-weight:600; cursor:pointer; }
    .vf-mark-btn:active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .vf-rec { display:inline-flex; align-items:center; gap:6px; font-size:0.82rem; font-weight:700; color:#ef4444; }
    .vf-rec-dot { width:10px; height:10px; border-radius:50%; background:#ef4444; animation:vf-pulse 1s infinite; }
    @keyframes vf-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* \u2500\u2500 Countdown Overlay \u2500\u2500 */
    #countdown-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(13,17,23,0.97); z-index: 200;
      flex-direction: column; align-items: center; justify-content: center;
    }
    #countdown-overlay.active { display: flex; }
    #countdown-num {
      font-size: 11rem; font-weight: 900;
      font-family: 'Menlo','SF Mono',monospace;
      line-height: 1; transition: color 0.1s;
    }
    #countdown-label {
      font-size: 1.1rem; color: var(--muted);
      margin-top: 16px; text-transform: uppercase; letter-spacing: 0.15em;
    }

    /* \u2500\u2500 Flash Overlay \u2500\u2500 */
    #flash-overlay {
      display: none; position: fixed; inset: 0;
      z-index: 250; pointer-events: none;
    }
    #flash-overlay.recall { background: rgba(248,81,73,0.82); display: block; }
    #flash-overlay.go { background: rgba(63,185,80,0.45); display: block; }
    #tap-flash {
      display: none; position: fixed; inset: 0;
      background: rgba(20,184,166,0.28); z-index: 199; pointer-events: none;
    }
    #tap-flash.show { display: block; }

    /* \u2500\u2500 Join Code \u2500\u2500 */
    .join-code {
      font-size: 3.2rem; font-family: 'Menlo',monospace;
      font-weight: 900; color: var(--accent);
      text-align: center; letter-spacing: 12px; padding: 20px;
    }
    .qr-wrap { text-align: center; padding: 12px 0; }
    .qr-wrap img { border-radius: 10px; max-width: 180px; }

    /* \u2500\u2500 Modal \u2500\u2500 */
    .modal-backdrop {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.72); z-index: 400;
      align-items: flex-end;
    }
    .modal-backdrop.active { display: flex; }
    .modal {
      background: var(--surface); border-radius: 20px 20px 0 0;
      padding: 24px 20px 44px; width: 100%;
      border-top: 1px solid var(--surface3);
    }
    .modal-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
    .modal-body { color: var(--muted); margin-bottom: 20px; font-size: 0.95rem; }

    /* \u2500\u2500 Toast \u2500\u2500 */
    #toast {
      position: fixed; bottom: 28px; left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: var(--surface); border: 1px solid var(--surface3);
      border-radius: 24px; padding: 10px 20px;
      font-size: 0.9rem; font-weight: 500;
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
      z-index: 350; white-space: nowrap;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    #toast.show { transform: translateX(-50%) translateY(0); }

    /* \u2500\u2500 Utility \u2500\u2500 */
    .stack { display: flex; flex-direction: column; gap: 10px; }
    .row { display: flex; gap: 10px; }
    .row > .btn { flex: 1; }
    .divider { border: none; border-top: 1px solid var(--surface3); margin: 16px 0; }
    .text-center { text-align: center; }
    .text-muted { color: var(--muted); }
    .text-sm { font-size: 0.85rem; }
    .text-xs { font-size: 0.75rem; }
    .font-mono { font-family: 'Menlo','SF Mono',monospace; }
    .mt-8 { margin-top: 8px; }
    .mt-16 { margin-top: 16px; }
    .mt-24 { margin-top: 24px; }
    .mt-32 { margin-top: 32px; }
    .hidden { display: none !important; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-8 { gap: 8px; }

    /* \u2500\u2500 XC name input inline \u2500\u2500 */
    .xc-name-input {
      background: transparent; border: none;
      border-bottom: 1px dashed var(--surface3);
      border-radius: 0; padding: 2px 0;
      font-size: 0.95rem; font-family: inherit;
      color: var(--text); width: 100%; outline: none;
    }
    .xc-name-input:focus { border-bottom-color: var(--accent); }

    /* \u2500\u2500 Admin Lane Input Row \u2500\u2500 */
    .status-btn {
  padding: 3px 7px; border-radius: 6px; font-size: .72rem; font-weight: 700;
  border: 1.5px solid var(--border); background: var(--surface2); color: var(--muted);
  cursor: pointer; letter-spacing: .04em; transition: all .15s;
}
.status-btn.active-dns { background: rgba(245,158,11,.18); color: #f59e0b; border-color: #f59e0b; }
.status-btn.active-dnf { background: rgba(239,68,68,.18); color: #ef4444; border-color: #ef4444; }
.admin-lane-row {
      display: flex; align-items: center;
      gap: 8px; padding: 6px 0;
      border-bottom: 1px solid var(--surface3);
    }
    .admin-lane-row:last-child { border-bottom: none; }
    .admin-lane-num {
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--surface3);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; flex-shrink: 0;
      color: var(--muted);
    }
    .admin-lane-name-input {
      flex: 1; background: transparent; border: none;
      border-radius: 0; padding: 6px 0;
      font-size: 0.95rem; font-family: inherit;
      color: var(--text); outline: none;
    }

    @media (max-width: 430px) {
      .clock { font-size: 3.4rem; }
      .tap-place { font-size: 4.5rem; }
      #countdown-num { font-size: 9rem; }
    }

    /* \u2500\u2500 Demo Card \u2500\u2500 */
    .demo-card {
      display: flex; align-items: center; gap: 14px;
      background: linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%);
      border: 1.5px solid rgba(245,158,11,0.35);
      border-radius: 14px; padding: 16px;
      cursor: pointer; transition: all 0.15s;
      -webkit-tap-highlight-color: transparent;
      margin-top: 20px;
    }
    .demo-card:active { transform: scale(0.98); filter: brightness(0.93); }
    .demo-card-icon { font-size: 2rem; flex-shrink: 0; }
    .demo-card-title { font-weight: 700; font-size: 0.95rem; color: #f59e0b; }
    .demo-card-desc { font-size: 0.78rem; color: var(--muted); margin-top: 2px; }
    .demo-card-arrow { margin-left: auto; font-size: 1.3rem; color: #f59e0b; flex-shrink: 0; }

    /* \u2500\u2500 Demo Banner (admin screen) \u2500\u2500 */
    .demo-banner {
      background: rgba(245,158,11,0.10);
      border: 1.5px solid rgba(245,158,11,0.30);
      border-radius: 12px; padding: 14px 16px;
      margin-bottom: 14px;
    }
    .demo-banner-top {
      display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .demo-code-pill {
      font-family: 'Menlo','SF Mono',monospace;
      font-size: 1.6rem; font-weight: 900; letter-spacing: 4px;
      color: #f59e0b; background: rgba(245,158,11,0.12);
      border: 1.5px solid rgba(245,158,11,0.3);
      border-radius: 8px; padding: 4px 14px;
      cursor: pointer; transition: all 0.15s; display: inline-block;
    }
    .demo-code-pill:active { transform: scale(0.96); }
    .demo-banner-hint { font-size: 0.78rem; color: var(--muted); }
    .demo-banner-hint strong { color: var(--text); }
    .demo-qr { margin-top: 10px; }
  
    /* \u2500\u2500 XC Photo Burst + Finish Card \u2500\u2500 */
    .finish-photo-wrap {
      width:100%;background:var(--surface3);border-radius:10px;
      overflow:hidden;margin-bottom:8px;position:relative;
      aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;
    }
    .finish-photo-wrap img { width:100%;height:100%;object-fit:cover;display:block; }
    .finish-photo-capturing {
      color:var(--muted);font-size:0.8rem;text-align:center;padding:16px;
    }
    .finish-photo-wrap .ocr-badge {
      position:absolute;top:6px;right:6px;
      background:rgba(20,184,166,0.9);color:#fff;
      font-size:0.7rem;font-weight:700;padding:3px 7px;border-radius:20px;
    }
    .bib-scan-row { display:flex;gap:6px;margin-bottom:8px; }
    /* Qualifier badge */
    .qualifier-chip {
      display:inline-flex;align-items:center;gap:4px;
      background:rgba(234,179,8,0.2);color:#eab308;
      font-size:0.65rem;font-weight:700;padding:2px 7px;border-radius:20px;
      border:1px solid rgba(234,179,8,0.4);
    }
    /* Finish card share overlay */
    #finish-card-overlay {
      position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9990;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:16px;gap:12px;
    }
    #finish-card-overlay canvas,
    #finish-card-overlay img { max-width:min(320px,85vw);border-radius:12px; }
    #finish-card-overlay .card-actions { display:flex;gap:10px;flex-wrap:wrap;justify-content:center; }

  
    /* v8.5.1 \u2014 auto-detect */
    #xc-line-setup-overlay {
      display:none;position:fixed;inset:0;z-index:9996;background:#000;
      flex-direction:column;
    }
    #xc-line-setup-overlay video {
      width:100%;height:100%;object-fit:cover;position:absolute;inset:0;
    }
    #xc-line-canvas-overlay {
      position:absolute;inset:0;width:100%;height:100%;touch-action:none;
    }
    #xc-line-instruction {
      position:absolute;top:16px;left:0;right:0;text-align:center;
      color:#fff;font-size:1rem;font-weight:600;
      background:rgba(0,0,0,.65);padding:10px;pointer-events:none;
    }
    #xc-line-setup-btns {
      position:absolute;bottom:0;left:0;right:0;
      display:flex;gap:10px;padding:16px;background:rgba(0,0,0,.7);
    }
    .xc-detect-bar {
      display:flex;align-items:center;gap:10px;
      padding:8px 14px;background:var(--surface-2);border-bottom:1px solid var(--border);
    }
    @keyframes xc-rec-pulse {
  0%, 100% { opacity:1; transform:scale(1); }
  50%       { opacity:.3; transform:scale(.7); }
}
.xc-detect-pulse {
      width:12px;height:12px;border-radius:50%;background:#ef4444;flex-shrink:0;
      animation:xcpulse 1s infinite;
    }
    @keyframes xcpulse {
      0%,100%{opacity:1;transform:scale(1)}
      50%{opacity:.4;transform:scale(.8)}
    }
    .xc-auto-countdown {
      display:inline-block;width:28px;height:28px;border-radius:50%;
      background:var(--accent);color:#fff;font-size:.75rem;font-weight:700;
      text-align:center;line-height:28px;flex-shrink:0;
    }

    
/* CT paywall */
.ct-paywall-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px}
.ct-paywall-overlay.hidden{display:none}
.ct-paywall-box{background:#fff;border-radius:18px;padding:28px 24px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.ct-paywall-logo{font-size:2rem;text-align:center;margin-bottom:6px}
.ct-paywall-title{font-size:1.15rem;font-weight:800;text-align:center;color:#0d1b3e;margin-bottom:4px}
.ct-paywall-sub{font-size:.85rem;text-align:center;color:#64748b;margin-bottom:20px}
.ct-plan-row{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.ct-plan-btn{display:block;padding:14px 18px;border-radius:10px;text-decoration:none;border:2px solid #e2e8f0;cursor:pointer;transition:border-color .15s,background .15s;text-align:left}
.ct-plan-btn:hover{border-color:#1a56db;background:#f0f5ff}
.ct-plan-btn.primary{background:#0d1b3e;border-color:#0d1b3e;color:#fff}
.ct-plan-btn.primary:hover{background:#1a3a6e;border-color:#1a3a6e}
.ct-plan-label{font-size:.95rem;font-weight:700}
.ct-plan-price{font-size:1.1rem;font-weight:900}
.ct-plan-desc{font-size:.78rem;opacity:.75;margin-top:2px}
.ct-divider{text-align:center;font-size:.8rem;color:#94a3b8;margin:4px 0 12px}
.ct-code-row{display:flex;gap:8px}
.ct-code-input{flex:1;padding:11px 14px;border:2px solid #e2e8f0;border-radius:8px;font-size:1rem;font-family:monospace;text-transform:uppercase;letter-spacing:.1em;outline:none}
.ct-code-input:focus{border-color:#1a56db}
.ct-code-submit{padding:11px 18px;background:#1a56db;color:#fff;border:none;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;white-space:nowrap}
.ct-code-submit:disabled{opacity:.5;cursor:default}
.ct-code-error{font-size:.82rem;color:#dc2626;margin-top:6px;min-height:18px}
.ct-access-badge{display:inline-flex;align-items:center;gap:5px;background:#dcfce7;color:#15803d;border-radius:6px;font-size:.75rem;font-weight:700;padding:3px 8px}
</style>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231a56db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='8' r='6'/><path d='M15.477 12.89 17 22l-5-3-5 3 1.523-9.11'/></svg>"><meta name="robots" content="index, follow">
<link rel="canonical" href="https://carnivaltiming.com/"><meta property="og:title" content="Carnival Timing \u2014 Live Race Management for School Carnivals"><meta property="og:description" content="Real-time race timing for school athletics, swimming and cross country carnivals. Multi-device, live results, QR pairing. Free to use."><meta property="og:url" content="https://carnivaltiming.com/"><meta property="og:type" content="website"><meta property="og:locale" content="en_AU"><meta property="og:site_name" content="Carnival Timing"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Carnival Timing \u2014 Live Race Management for School Carnivals"><meta name="twitter:description" content="Real-time race timing for school athletics, swimming and cross country carnivals. Multi-device, live results, QR pairing. Free to use."><script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Carnival Timing",
  "alternateName": "Sport Portal",
  "url": "https://carnivaltiming.com",
  "logo": "https://carnivaltiming.com/favicon.svg",
  "description": "School sport management platform \u2014 carnivals, live timing, district hub, parent-facing results.",
  "address": {"@type": "PostalAddress", "addressCountry": "AU", "addressRegion": "VIC"},
  "founder": {"@type": "Person", "name": "Paddy Gallivan"},
  "legalName": "Luck Dragon Pty Ltd",
  "taxID": "ABN 64 697 434 898",
  "email": "info@schoolsportportal.com.au",
  "areaServed": {"@type": "Country", "name": "Australia"},
  "knowsAbout": ["School sport", "Athletics carnivals", "Swimming carnivals", "Cross country", "Live event timing"]
}<\/script><script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js" integrity="sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>
</head>
<body>

<!-- XC photo burst camera elements -->
<video id="xc-cam" autoplay playsinline muted style="display:none;position:absolute;width:1px;height:1px"></video>
<canvas id="xc-cap" style="display:none"></canvas>

<div id="reconnect-banner" style="display:none;position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#000;text-align:center;padding:8px 16px;font-size:.9rem;font-weight:600;letter-spacing:.02em;">
  \u26A1 Reconnecting\u2026
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: HOME
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-home" class="screen active">
  <div class="home-hero">
    <div class="home-logo">CT</div>
    <div class="home-title">Carnival Timing</div>
    <div class="home-tagline">Real-time race timing \u2014 no stopwatches, no paper, no chaos</div>
    <div style="font-size:0.72rem;color:rgba(255,255,255,0.3);text-align:center;margin-top:6px;letter-spacing:0.08em;text-transform:uppercase">Track \xB7 Swimming \xB7 Cross Country</div>
    <div class="home-sports">
      <div class="home-sport-pill"><span><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/></svg></span>Track & Field</div>
      <div class="home-sport-pill"><span><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><path d='M2 20s2-2 5-2 5 2 7 2 5-2 7-2 3 1 3 1M2 16s2-2 5-2 5 2 7 2 5-2 7-2 3 1 3 1'/><circle cx='14' cy='5' r='2'/></svg></span>Swimming</div>
      <div class="home-sport-pill"><span><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><path d='M12 22V8M5 8l7-6 7 6M3 22h18M9 22V16h6v6'/></svg></span>Cross Country</div>
    </div>
  </div>
  <div class="content">
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:20px 0 4px;padding:0 8px">
      <div style="font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>No app install</div>
      <div style="font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Any phone or tablet</div>
      <div style="font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Real-time sync</div>
      <div style="font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:5px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Live demo free</div>
    </div>
    <div class="stack">
      <button class="btn btn-primary" onclick="showScreen('setup')" style="text-align:center;line-height:1.3"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle;margin-right:6px'><rect width='20' height='14' x='2' y='6' rx='2'/><line x1='2' x2='22' y1='10' y2='10'/><path d='M9 6V2h6v4'/></svg> Host a carnival<div style="font-size:0.72rem;font-weight:400;opacity:0.75;margin-top:2px">create &amp; run the event</div></button>
      <button class="btn btn-secondary" onclick="showScreen('join-screen')" style="text-align:center;line-height:1.3"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle;margin-right:6px'><rect x='5' y='2' width='14' height='20' rx='2'/><path d='M12 18h.01'/></svg> Join with code<div style="font-size:0.72rem;font-weight:400;opacity:0.75;margin-top:2px">timer · marshal · observer</div></button>
    </div>

    <div class="demo-card" onclick="startDemo()">
      <div class="demo-card-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div style="flex:1">
        <div class="demo-card-title">Live demo</div>
        <div class="demo-card-desc">Runs a real carnival with 8 athletes. No sign-up.</div>
      </div>
      <div class="demo-card-arrow">\u2192</div>
    </div>

    <!-- \u2500\u2500 How it works \u2500\u2500 -->
    <div style="margin-top:32px">
      <details style="margin-top:32px;border:1px solid rgba(255,255,255,0.15);border-radius:12px"><summary style="cursor:pointer;padding:14px 20px;font-size:0.95rem;font-weight:600;color:rgba(255,255,255,0.85);list-style:none;text-align:center">▾ Learn how it works · roles · timer counts</summary>
<div style="font-size:0.8rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;text-align:center">How it works</div>

      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:0.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">1</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">Race Control creates a carnival</div>
            <div style="font-size:0.78rem;color:var(--muted);margin-top:2px">Takes 10 seconds. You get a 4-letter code.</div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:0.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">2</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">Everyone joins on their phone</div>
            <div style="font-size:0.78rem;color:var(--muted);margin-top:2px">Open carnivaltiming.com, tap Join Carnival, enter the code. Pick a role \u2014 Timer, Observer, Starter or XC Marshal.</div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:0.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">3</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">Race Control arms &amp; fires GO</div>
            <div style="font-size:0.78rem;color:var(--muted);margin-top:2px">All timers start simultaneously. Tap STOP when your athlete finishes.</div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:26px;height:26px;border-radius:50%;background:var(--accent);color:#fff;font-weight:700;font-size:0.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">4</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">Times sync instantly \u2014 publish when ready</div>
            <div style="font-size:0.78rem;color:var(--muted);margin-top:2px">Race Control sees all splits live and publishes the averaged result.</div>
          </div>
        </div>
      </div>

      <!-- Roles -->
      <div style="margin-top:20px;background:var(--surface);border-radius:12px;padding:14px 16px">
        <div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em">Roles</div>
        <div style="display:flex;flex-direction:column;gap:7px;font-size:0.82rem">
          <div style="display:flex;gap:8px"><span style="font-weight:700;min-width:110px">Race Control</span><span style="color:var(--muted)">Arms races, fires GO/RECALL, publishes results. One per carnival.</span></div>
          <div style="display:flex;gap:8px"><span style="font-weight:700;min-width:110px">Timer</span><span style="color:var(--muted)">Taps STOP for one lane. Bring 2\u20133 per lane for accuracy.</span></div>
          <div style="display:flex;gap:8px"><span style="font-weight:700;min-width:110px">Starter</span><span style="color:var(--muted)">Fires GO from the start line (optional \u2014 Race Control can do it).</span></div>
          <div style="display:flex;gap:8px"><span style="font-weight:700;min-width:110px">Observer</span><span style="color:var(--muted)">Watches live splits on any device. Read-only.</span></div>
          <div style="display:flex;gap:8px"><span style="font-weight:700;min-width:110px">XC Marshal</span><span style="color:var(--muted)">Taps finishers in order at the cross country finish chute.</span></div>
        </div>
      </div>

      <!-- Timer accuracy -->
      <div style="margin-top:10px;background:var(--surface);border-radius:12px;padding:14px 16px">
        <div style="font-size:0.78rem;font-weight:700;margin-bottom:8px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em">How many timers per lane?</div>
        <div style="font-size:0.82rem;display:flex;flex-direction:column;gap:5px">
          <div style="display:flex;gap:8px"><span style="min-width:70px;font-weight:700">1 timer</span><span style="color:var(--muted)">That time is used directly.</span></div>
          <div style="display:flex;gap:8px"><span style="min-width:70px;font-weight:700">2 timers</span><span style="color:var(--muted)">Average of both.</span></div>
          <div style="display:flex;gap:8px"><span style="min-width:70px;font-weight:700">3+ timers</span><span style="color:var(--muted)">Trimmed mean \u2014 fastest and slowest dropped, rest averaged. <strong>Recommended for accuracy.</strong></span></div>
        </div>
        </details>
<div style="margin-top:8px;font-size:0.78rem;color:var(--muted)">No hard limit on timers. More timers per lane = more accurate result.</div>
      </div>
    </div>


    <!-- \u2500\u2500 WD26 Live Carnival \u2500\u2500 -->
    <div style="margin-top:24px;background:linear-gradient(135deg,#14532d 0%,#166534 60%,#16a34a 100%);border-radius:14px;padding:18px 20px;color:#fff;border:2px solid #22c55e">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:1.1rem">\u{1F534}</span>
        <span style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#86efac">Live Carnival</span>
      </div>
      <div style="font-size:0.98rem;font-weight:700;margin-bottom:6px;line-height:1.3">Williamstown District Cross Country 2026</div>
      <div style="font-size:0.82rem;color:rgba(255,255,255,0.8);margin-bottom:14px;line-height:1.5">Track runners, view live results and follow qualifiers for the WD26 district carnival in real time.</div>
      <a href="https://sportcarnival.com.au/wd26" target="_blank" style="background:#22c55e;color:#052e16;padding:9px 18px;border-radius:7px;font-size:0.85rem;font-weight:700;text-decoration:none;display:inline-block">View Live Results \u2192</a>
    </div>

    <!-- \u2500\u2500 School Sport Portal upsell \u2500\u2500 -->
    <div style="margin-top:24px;background:linear-gradient(135deg,#0d1b3e 0%,#1a3a6e 60%,#1a56db 100%);border-radius:14px;padding:18px 20px;color:#fff">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:1.1rem">\u{1F3C5}</span>
        <span style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#fcd34d">School Sport Portal</span>
      </div>
      <div style="font-size:0.98rem;font-weight:700;margin-bottom:6px;line-height:1.3">Want persistent results, house points &amp; district qualifiers?</div>
      <div style="font-size:0.82rem;color:rgba(255,255,255,0.75);margin-bottom:14px;line-height:1.5">Carnival Timing is free and always will be. School Sport Portal adds automatic house point tallies, event program builder, district qualifier tracking and permanent public results pages \u2014 for $1/student/year.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="https://schoolsportportal.com.au" target="_blank" style="background:#f59e0b;color:#0d1b3e;padding:9px 18px;border-radius:7px;font-size:0.85rem;font-weight:700;text-decoration:none;display:inline-block">See School Sport Portal \u2192</a>
        <a href="https://schoolsportportal.com.au#demo" target="_blank" style="border:1.5px solid rgba(255,255,255,0.3);color:#fff;padding:8px 16px;border-radius:7px;font-size:0.85rem;font-weight:600;text-decoration:none;display:inline-block">Live demo</a>
      </div>
    </div>

    <div class="text-center text-muted text-xs mt-32">
      Auto-reconnects \xB7 No app install \xB7 Join &amp; observe free<br>
      <span style="opacity:0.5">Carnival Timing \xB7 carnivaltiming.com</span>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: SETUP (New Carnival)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-setup" class="screen">
  <div class="header">
    <div class="logo-badge">SP</div>
    <div class="header-title">New Carnival</div>
    <div class="header-right">
      <button class="btn btn-icon btn-sm" onclick="showScreen('home')">\u2190 Back</button>
    </div>
  </div>
  <div class="content">
    <div class="form-group">
      <label>School Name</label>
      <input type="text" id="setup-school" placeholder="e.g. Williamstown Primary School">
    </div>
    <div class="form-group">
      <label>Carnival / Event Name</label>
      <input type="text" id="setup-name" placeholder="e.g. Winter Sport 2026">
    </div>
    <div class="form-group">
      <label>Sport Type</label>
      <div class="sport-grid">
        <div class="sport-btn active" data-sport="track" onclick="selectSport('track')">
          <div class="s-icon"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/></svg></div>
          <div class="s-label">Track & Field</div>
          <div class="s-desc">Lane timing</div>
        </div>
        <div class="sport-btn" data-sport="swim" onclick="selectSport('swim')">
          <div class="s-icon"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><path d='M2 20s2-2 5-2 5 2 7 2 5-2 7-2 3 1 3 1M2 16s2-2 5-2 5 2 7 2 5-2 7-2 3 1 3 1'/><circle cx='14' cy='5' r='2'/></svg></div>
          <div class="s-label">Swimming</div>
          <div class="s-desc">Lane timing</div>
        </div>
        <div class="sport-btn" data-sport="xc" onclick="selectSport('xc')">
          <div class="s-icon"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><path d='M12 22V8M5 8l7-6 7 6M3 22h18M9 22V16h6v6'/></svg></div>
          <div class="s-label">Cross Country</div>
          <div class="s-desc">Finish order tap</div>
        </div>
        <div class="sport-btn" data-sport="mixed" onclick="selectSport('mixed')">
          <div class="s-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
          <div class="s-label">Mixed Events</div>
          <div class="s-desc">All modes</div>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Competition Tier</label>
      <div class="pill-row">
        <div class="pill active" data-tier="school" onclick="selectTier('school')">School</div>
        <div class="pill" data-tier="district" onclick="selectTier('district')">District</div>
        <div class="pill" data-tier="region" onclick="selectTier('region')">Region</div>
        <div class="pill" data-tier="state" onclick="selectTier('state')">State</div>
      </div>
    </div>
    <div class="form-group">
      <label>Accent Colour <span style="font-weight:400;text-transform:none;font-size:0.85em">(optional)</span></label>
      <input type="text" id="setup-colour" placeholder="#14b8a6 \u2014 leave blank for teal">
    </div>
        <div class="form-group">
      <label>Houses <span style="color:var(--muted);font-size:.8rem;font-weight:400">(optional \u2014 for points tally)</span></label>
      <input type="text" id="setup-houses" placeholder="Red, Blue, Green, Yellow">
      <div style="color:var(--muted);font-size:.75rem;margin-top:4px">Comma-separated. Leave blank to skip house points.</div>
    </div>
    <div class="form-group">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <label style="margin:0">Event Program <span style="color:var(--muted);font-size:.8rem;font-weight:400">(optional)</span></label>
        <button type="button" class="btn btn-secondary" style="padding:4px 10px;font-size:.8rem" onclick="addProgramRow()">+ Add Event</button>
      </div>
      <div id="program-rows" style="max-height:240px;overflow-y:auto"></div>
      <div style="color:var(--muted);font-size:.75rem;margin-top:4px">Pre-load your day's schedule. Use "Next Event \u2192" in Race Control to auto-advance.</div>
    </div>
    <button class="btn btn-primary mt-8" onclick="createCarnival()">Create Carnival \u2192</button>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: JOIN
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-join-screen" class="screen">
  <div class="header">
    <div class="logo-badge">SP</div>
    <div class="header-title">Join Carnival</div>
    <div class="header-right">
      <button class="btn btn-icon btn-sm" onclick="showScreen('home')">\u2190 Back</button>
    </div>
  </div>
  <div class="content">
    <div class="form-group">
      <label>Carnival code (4–8 chars)</label>
      <input type="text" id="join-code-input" placeholder="ABCD"
        maxlength="8"
        style="font-family:'Menlo',monospace;font-size:1.8rem;text-transform:uppercase;letter-spacing:8px;text-align:center">
    </div>
    <div class="form-group">
      <label>Your Name</label>
      <input type="text" id="join-name-input" placeholder="e.g. Alex">
    </div>
    <button class="btn btn-primary" onclick="joinCarnival()">Join \u2192</button>
    <div id="join-error" class="text-center text-muted mt-16 hidden" style="color:var(--danger)"></div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: ROLE PICKER
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-role" class="screen">
  <div class="header">
    <div class="logo-badge">SP</div>
    <div>
      <div class="header-title" id="role-school-name">Choose Role</div>
      <div class="header-sub" id="role-carnival-name"></div>
    </div>
  </div>
  <div class="content">
    <div class="card">
      <div class="card-title">Carnival</div>
      <div style="font-size:1rem;font-weight:700" id="role-joined-name"></div>
      <div class="text-xs text-muted mt-8 font-mono" id="role-joined-code"></div>
      <div class="text-xs text-muted mt-4" id="role-expires-note" style="display:none"></div>
    </div>
    <div id="role-grid" class="role-grid"></div>
    <div id="role-lane-picker" class="hidden mt-16">
      <label style="font-size:1.1rem;font-weight:700;display:block;margin-bottom:12px">Which lane are you timing?</label>
      <div id="lane-pick-btns" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: TIMER (Lane)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-timer" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="timer-dot"></div><span id="timer-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div>
      <div class="header-title" id="timer-lane-label">Lane 1</div>
      <div class="header-sub" id="timer-event-label"></div>
    </div>
    <div class="header-right" id="timer-badge-wrap"></div>
  </div>
  <div class="content">
    <div class="card" id="timer-athlete-card">
      <div class="card-title" id="timer-athlete-event">Event</div>
      <div id="timer-athlete-name" style="font-size:1.5rem;font-weight:700">\u2014</div>
      <div id="timer-athlete-note" class="text-muted text-sm"></div>
    </div>

    <div id="timer-recall-banner" class="hidden" style="background:#7f1d1d;color:#fca5a5;border-radius:10px;padding:10px 14px;text-align:center;font-weight:700;font-size:1.05rem;margin-bottom:8px;">FALSE START \u2014 Race Recalled</div>

    <div class="clock" id="timer-clock">0:00.00</div>

    <div class="form-group" id="timer-name-gate">
      <label>Your name (auto-filled)</label>
      <input type="text" id="timer-name-input" placeholder="e.g. Alex">
    </div>

    <button class="btn btn-stop" id="timer-stop-btn" onclick="timerStop()" disabled>STOP</button>

    <div id="timer-my-split" class="hidden mt-16">
      <div class="card">
        <div class="card-title">Your time</div>
        <div id="timer-my-time" class="font-mono" style="font-size:2.2rem;font-weight:700;color:var(--accent)"></div>
      </div>
    </div>

    <div id="timer-splits-card" class="card mt-8 hidden">
      <div class="card-title">All timers this lane</div>
      <div class="text-xs text-muted" style="padding:0 4px 6px;line-height:1.4;">Race Control publishes a <strong>trimmed mean</strong> \u2014 with 3+ timers the fastest and slowest are dropped.</div>
      <div id="timer-splits-list"></div>
    </div>

    <div id="timer-waiting-msg" class="text-center text-muted mt-32">
      <div style="font-size:2.5rem"><svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><circle cx='12' cy='13' r='8'/><path d='M12 9v4l2 2M9 2h6'/></svg></div>
      <div class="mt-8">Waiting for race to be armed...</div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: ADMIN (Lane Race)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-admin" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="admin-dot"></div><span id="admin-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div class="header-title">Race Control</div>
    <div class="header-right"><span class="text-muted text-xs" id="admin-school-lbl"></span></div>
  </div>
  <div class="content">

    <!-- Demo banner (shown when isDemo=true) -->
    <div id="admin-demo-banner" class="demo-banner hidden">
      <div class="demo-banner-top">
        <span style="font-size:1.1rem;font-weight:700;color:#f59e0b">Demo Carnival</span>
        <span class="badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;border-color:rgba(245,158,11,0.3)">DEMO</span>
      </div>
      <div class="demo-banner-hint" style="margin-bottom:10px">
        <strong>Share this code</strong> \u2014 open carnivaltiming.com on another device and tap "Join Carnival"
      </div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span class="demo-code-pill" id="demo-code-display" onclick="copyDemoCode()" title="Tap to copy" style="font-style:italic;opacity:0.6">Loading…</span>
        <button class="btn btn-icon btn-sm" onclick="copyDemoCode()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy code</button>
      </div>
      <div class="demo-qr">
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:6px">Or scan to join from phone:</div>
        <div id="demo-qr-canvas" style="display:inline-block;background:#fff;padding:6px;border-radius:6px"></div>
      </div>
    </div>

    <!-- Staff PIN widget — QR for in-person scanning + PIN for verbal sharing -->
    <div id="admin-staff-pin-card" class="card" style="display:none;margin-bottom:12px;border-left:3px solid var(--accent);background:linear-gradient(135deg,var(--surface2),var(--surface))">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div id="admin-staff-pin-qr" style="background:#fff;padding:6px;border-radius:8px;width:104px;height:104px;flex-shrink:0;cursor:pointer" onclick="_expandStaffQr()" title="Tap to enlarge"></div>
        <div style="flex:1;min-width:170px">
          <div style="font-size:0.7rem;font-weight:700;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px">Staff Access</div>
          <div style="font-size:0.78rem;color:var(--muted);line-height:1.35;margin-bottom:8px">Volunteers scan the QR to auto-join with timing access — no typing.</div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:0.72rem;color:var(--muted)">PIN:</span>
            <span id="admin-staff-pin-val" style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:1.25rem;font-weight:800;letter-spacing:0.12em;color:var(--accent);padding:3px 10px;background:rgba(20,184,166,0.1);border-radius:6px;cursor:pointer" onclick="_copyStaffPin()" title="Tap to copy">----</span>
            <button class="btn btn-icon btn-sm" onclick="_rotateStaffPin()" title="Rotate"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Setup panel -->
    <div id="admin-setup-panel">
      <div class="card">
        <div class="card-title">Race Setup</div>
        <div class="form-group">
          <label>Age Group</label>
          <select id="admin-age-sel"></select>
        </div>
        <div class="form-group">
          <label>Gender</label>
          <div class="pill-row">
            <div class="pill active" data-ag="boys" onclick="selectAdminGender('boys')">Boys</div>
            <div class="pill" data-ag="girls" onclick="selectAdminGender('girls')">Girls</div>
            <div class="pill" data-ag="mixed" onclick="selectAdminGender('mixed')">Mixed</div>
          </div>
        </div>
        <div class="form-group mb-0">
          <label>Event</label>
          <select id="admin-event-sel"></select>
        </div>
      </div>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="card-title" style="margin:0">Lane Assignments</div>
          <button type="button" class="btn btn-secondary" style="padding:4px 12px;font-size:.78rem" onclick="openRosterModal()">\u{1F4CB} Paste Roster</button>
        </div>
        <div id="admin-lane-inputs"></div>
      </div>
      <div class="card" id="admin-house-card" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div class="card-title" style="margin:0">House Points</div>
          <button type="button" class="btn btn-secondary" style="padding:4px 10px;font-size:.78rem;color:#ef4444;border-color:#ef4444" onclick="adminResetHousePoints()">Reset</button>
        </div>
        <div id="admin-house-standings"></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="adminArm()" style="flex:1">ARM RACE \u2192</button>
        <button class="btn btn-secondary" id="admin-next-event-btn" onclick="adminNextEvent()" style="flex:1;display:none">Next Event \u2192</button>
      </div>
    </div>

    <!-- Live panel -->
    <div id="admin-live-panel" class="hidden">
      <div class="card">
        <div class="flex items-center gap-8" style="margin-bottom:6px">
          <div id="admin-race-lbl" style="font-weight:700;font-size:1.05rem;flex:1"></div>
          <span id="admin-state-badge" class="badge badge-armed">ARMED</span>
        </div>
        <div class="clock" id="admin-live-clock" style="font-size:3rem;padding:8px 0">0:00.00</div>
      </div>
      <div class="row">
        <button class="btn btn-go" id="admin-go-btn" onclick="adminGo()">GO</button>
        <button class="btn btn-secondary" onclick="adminRecall()">RECALL</button>
      </div>
      <div class="row mt-8">
        <button class="btn btn-secondary" onclick="adminClear()">CLEAR SPLITS</button>
        <button class="btn btn-secondary" onclick="adminAbandon()">ABANDON</button>
      </div>
      <div class="row mt-8">
        <button class="btn btn-secondary" onclick="adminRenameLanes()" style="flex:1"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Names</button>
      </div>
      <hr class="divider">
      <div class="card-title">Live Splits</div>
      <div class="text-xs text-muted" style="padding:0 4px 8px;line-height:1.4;">Published time = <strong>trimmed mean</strong>. 3+ timers: drop fastest &amp; slowest, mean the rest. 2 timers: plain mean. 1 timer: that value.</div>
      <div id="admin-splits-list"></div>
      <button class="btn btn-primary mt-16 hidden" id="admin-publish-btn" onclick="adminPublish()"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><rect x='8' y='2' width='8' height='4' rx='1' ry='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/></svg> Publish Results</button>
      <div id="admin-export-btns" class="hidden" style="display:none;gap:8px;margin-top:8px">
        <button class="btn btn-secondary" style="flex:1" onclick="adminExportCSV()">\u2B07 Export CSV</button>
        <button class="btn btn-secondary" style="flex:1" onclick="adminPrintResults()">\u{1F5A8} Print</button>
      </div>
    </div>

    <!-- Done panel -->
    <div id="admin-done-panel" class="hidden">
      <div class="card">
        <div class="card-title">Published Results</div>
        <div id="admin-results-list"></div>
      </div>
      <div class="row mt-8">
        <button class="btn btn-primary" id="admin-done-publish-btn" onclick="adminPublishFromDone()">Publish Results</button>
        <button class="btn btn-secondary" onclick="adminNewRace()">+ New Race</button>
        <button class="btn btn-secondary" onclick="exportCSV()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export CSV</button>
      </div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: STARTER
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-starter" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="starter-dot"></div><span id="starter-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div class="header-title">Starter</div>
    <div class="header-right"><span id="starter-event-lbl" class="text-muted text-xs"></span></div>
  </div>
  <div class="content">
    <div id="starter-waiting" class="text-center" style="padding-top:60px">
      <div style="font-size:3.5rem"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'/><path d='M10.3 21a1.94 1.94 0 0 0 3.4 0'/></svg></div>
      <div class="text-muted mt-16">Waiting for Race Control to arm...</div>
    </div>
    <div id="starter-armed" class="hidden">
      <div class="card text-center">
        <div id="starter-race-info" class="text-muted text-sm"></div>
        <div class="clock mt-8" id="starter-clock">0:00.00</div>
      </div>

      <!-- Gun detection panel -->
      <div style="margin-top:16px;padding:16px;background:var(--surface-2);border-radius:12px">
        <!-- Idle state -->
        <div id="starter-listen-idle">
          <div style="font-size:0.8rem;color:var(--muted);text-align:center;margin-bottom:12px">Point mic toward the starting pistol</div>
          <button class="btn btn-primary" style="width:100%;font-size:1.1rem;padding:16px" onclick="starterListenStart()">
            \u{1F399}\uFE0F Listen for Gun
          </button>
        </div>
        <!-- Listening state -->
        <div id="starter-listen-active" class="hidden">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:10px;height:10px;border-radius:50%;background:#ef4444;animation:vf-pulse 0.8s infinite;flex-shrink:0"></div>
            <div style="font-size:0.9rem;font-weight:700;color:#ef4444;flex:1">Listening\u2026</div>
            <div id="starter-cal-lbl" style="font-size:0.72rem;color:var(--muted)">Calibrating</div>
          </div>
          <!-- Volume bar -->
          <div style="background:var(--surface);border-radius:4px;height:14px;overflow:hidden;margin-bottom:10px">
            <div id="starter-vol-bar" style="height:100%;width:0%;background:var(--accent);border-radius:4px;transition:width 0.04s"></div>
          </div>
          <!-- Sensitivity -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
            <span style="font-size:0.75rem;color:var(--muted)">Sensitivity:</span>
            <button class="btn btn-secondary" style="font-size:0.75rem;padding:4px 10px" data-sens="high" onclick="starterSetSens('high')">High</button>
            <button class="btn btn-primary"   style="font-size:0.75rem;padding:4px 10px" data-sens="med"  onclick="starterSetSens('med')">Med</button>
            <button class="btn btn-secondary" style="font-size:0.75rem;padding:4px 10px" data-sens="low"  onclick="starterSetSens('low')">Low</button>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" style="flex:1;font-size:0.85rem" onclick="starterListenStop()">Stop Listening</button>
            <button class="btn btn-secondary" style="font-size:0.85rem;padding:8px 12px" title="Recalibrate noise floor" onclick="starterRecalibrate()">\u21BA Recal</button>
          </div>
        </div>
      </div>

      <!-- Manual fallback + recall -->
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-secondary" style="flex:1;font-size:0.85rem" id="starter-go-btn" onclick="starterGo()">Manual GO</button>
        <button class="btn btn-secondary" style="flex:1;font-size:0.85rem;color:var(--danger);border-color:var(--danger)" onclick="starterRecall()">RECALL</button>
      </div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: OBSERVER (Lane Race)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-observer" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="observer-dot"></div><span id="observer-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div class="header-title">Live Results</div>
    <div class="header-right"><span id="observer-event-lbl" class="text-muted text-xs"></span></div>
  </div>
  <div class="content">
    <div class="clock" id="observer-clock" style="font-size:2.8rem">0:00.00</div>
    <div id="observer-lanes-list"></div>
    <div id="observer-waiting" class="text-center text-muted mt-32">
      <div style="opacity:0.35;margin-bottom:8px"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg></div>
      <div class="mt-8">Waiting for next race...</div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: XC MARSHAL
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-marshal" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="marshal-dot"></div><span id="marshal-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div class="header-title">Finish Marshal</div>
    <div class="header-right" style="display:flex;align-items:center;gap:6px"><span id="marshal-event-lbl" class="text-xs text-muted"></span><button id="xc-rec-btn" onclick="xcToggleRecord()" title="Record video" style="background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:0.75rem;padding:3px 7px;cursor:pointer;line-height:1">\u{1F4F9}</button></div>
  </div>
  <div class="content" style="padding:0">
    <!-- WAITING -->
    <div id="marshal-waiting" class="text-center" style="padding:60px 20px 0">
      <div id="marshal-wait-msg" class="text-muted mt-16">Waiting for race to start...</div>
    </div>

    <!-- LIVE -->
    <div id="marshal-live" class="hidden" style="display:flex;flex-direction:column;height:100%">
      
      <!-- Auto-detect toggle bar -->
      <div id="xc-auto-bar" style="display:none" class="xc-detect-bar">
        <div class="xc-detect-pulse"></div>
        <div style="flex:1;font-size:.85rem;font-weight:600;color:var(--text)" id="xc-detect-status">Setting up\u2026</div>
        <input type="range" id="xc-sensitivity" min="8" max="55" value="22"
          style="width:70px" title="Sensitivity"
          oninput="xcDiffThreshold=+this.value;document.getElementById('xc-sens-val').textContent=this.value"
          >
        <span id="xc-sens-val" style="font-size:.7rem;color:var(--muted);min-width:18px">22</span>
        <button class="btn btn-secondary btn-sm" onclick="xcStopAutoMode()" style="font-size:.7rem">\u2715 Off</button>
      </div>
      <!-- Auto-detect mode button -->
      <button id="xc-auto-mode-btn" class="btn btn-secondary btn-sm"
        style="width:100%;border-radius:0;border-left:none;border-right:none;border-top:none;padding:8px;font-size:.8rem"
        onclick="xcStartAutoMode()">\u{1F3AF} Switch to Auto-Detect (no tapping)</button>
      <!-- Recording status bar \u2014 visible only when recording -->
      <div id="xc-rec-bar" style="display:none;align-items:center;gap:8px;padding:6px 12px;background:#1c0000;border-bottom:2px solid #ef4444;flex-shrink:0">
        <div style="width:10px;height:10px;border-radius:50%;background:#ef4444;animation:xc-rec-pulse 1s ease-in-out infinite;flex-shrink:0"></div>
        <div style="flex:1;font-size:.82rem;font-weight:700;color:#ef4444;letter-spacing:.04em" id="xc-rec-status">\u25CF REC 00:00</div>
        <button onclick="xcStopRecording()" style="background:#ef4444;border:none;border-radius:5px;color:#fff;font-size:.72rem;font-weight:700;padding:4px 9px;cursor:pointer">\u23F9 Stop &amp; Save</button>
      </div>
      <!-- Finisher list -->
      <div style="flex:1;overflow-y:auto;padding:10px 16px" id="marshal-finishes-wrap">
        <div id="marshal-finishes-list"></div>
        <div class="text-center mt-8">
          <button class="btn btn-icon btn-sm" onclick="marshalUndo()">\u21A9 Undo last</button>
        </div>
      </div>

      <!-- Inline bib numpad -->
      <div id="marshal-bib-pad" class="hidden"
        style="flex-shrink:0;padding:14px 16px 16px;background:var(--surface-2);border-top:2px solid var(--accent)">
        <!-- Finish photo preview -->
        <div class="finish-photo-wrap" id="finish-photo-wrap">
          <div class="finish-photo-capturing" id="finish-photo-status">\u{1F4F7} Capturing\u2026</div>
          <img id="finish-photo-img" src="" style="display:none">
        </div>
        <!-- Bib label + OCR row -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <div style="font-size:0.82rem;font-weight:700;color:var(--text);flex:1"
            id="marshal-bib-for">Enter bib for 1st place</div>
          <button class="btn btn-secondary btn-sm" id="ocr-btn" onclick="runBibOCR()" style="flex-shrink:0;font-size:0.72rem">\u{1F50D} Auto</button>
        </div>
        <div style="font-size:2.2rem;font-weight:700;color:var(--accent);letter-spacing:0.12em;min-height:2.6rem;margin-bottom:8px"
          id="marshal-bib-display">_</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:280px">
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('1')">1</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('2')">2</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('3')">3</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('4')">4</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('5')">5</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('6')">6</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('7')">7</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('8')">8</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('9')">9</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem;color:var(--danger)" onclick="bibBack()">\u232B</button>
          <button class="btn btn-secondary" style="padding:14px;font-size:1.1rem" onclick="bibDigit('0')">0</button>
          <button class="btn btn-primary" style="padding:14px;font-size:1.1rem" onclick="bibConfirm()">\u2713</button>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%;max-width:280px;margin-top:8px" onclick="bibSkip()">Skip \u2014 bib unknown</button>
      </div>
      <!-- Big tap button \u2014 always at bottom (thumb zone), tappable even while bib pad is open -->
      <button class="btn-tap" id="marshal-tap-btn" onclick="marshalTap()"
        style="flex-shrink:0;border-radius:0;margin:0;width:100%">
        <span class="tap-main" id="marshal-clock-mini">0:00.00</span>
        <span class="tap-sub" id="marshal-tap-sub">TAP FINISH</span>
      </button>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: XC ADMIN
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-admin-xc" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="xc-admin-dot"></div><span id="xc-admin-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div class="header-title">XC Race Control</div>
    <div class="header-right"><span class="text-xs text-muted" id="xc-admin-school-lbl"></span></div>
  </div>
  <div class="content">

    <!-- Setup -->
    <div id="xc-setup-panel">
      <div class="card">
        <div class="card-title">Race Setup</div>
        <div class="form-group">
          <label>Age Group</label>
          <select id="xc-age-sel"></select>
        </div>
        <div class="form-group">
          <label>Gender</label>
          <div class="pill-row">
            <div class="pill active" data-xcg="boys" onclick="selectXCGender('boys')">Boys</div>
            <div class="pill" data-xcg="girls" onclick="selectXCGender('girls')">Girls</div>
            <div class="pill" data-xcg="mixed" onclick="selectXCGender('mixed')">Mixed</div>
          </div>
        </div>
        <div class="form-group mb-0">
          <label>Race / Distance</label>
          <select id="xc-event-sel"></select>
        </div>
      </div>
      <button class="btn btn-primary" onclick="xcAdminArm()">ARM RACE \u2192</button>
    </div>

    <!-- Live -->
    <div id="xc-live-panel" class="hidden">
      <div class="card">
        <div class="flex items-center gap-8" style="margin-bottom:6px">
          <div id="xc-race-lbl" style="font-weight:700;font-size:1.05rem;flex:1"></div>
          <span id="xc-state-badge" class="badge badge-armed">ARMED</span>
        </div>
        <div class="clock" id="xc-admin-clock" style="font-size:3rem;padding:8px 0">0:00.00</div>
      </div>
      <div class="row">
        <button class="btn btn-go" id="xc-go-btn" onclick="xcAdminGo()">GO</button>
        <button class="btn btn-secondary" onclick="xcAdminRecall()">RECALL</button>
      </div>
      <div class="row mt-8">
        <button class="btn btn-secondary" onclick="xcAdminAbandon()">ABANDON</button>
        <button class="btn btn-primary hidden" id="xc-publish-btn" onclick="xcAdminPublish()"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><rect x='8' y='2' width='8' height='4' rx='1' ry='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/></svg> Publish Results</button>
      </div>
      <hr class="divider">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div class="card-title" style="margin-bottom:0;flex:1">Finishers <span id="xc-count-lbl" class="text-muted text-xs"></span></div>
        <label style="font-size:0.78rem;color:var(--muted);display:flex;align-items:center;gap:6px">
          \u{1F3C5} Qual spots
          <input type="number" id="xc-qual-spots" value="10" min="0" max="99"
            style="width:52px;background:var(--surface3);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:3px 6px;font-size:0.82rem;text-align:center">
        </label>
      </div>
      <div id="xc-finishers-list"></div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: XC OBSERVER
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-observer-xc" class="screen">
  <div class="header">
    <button class="btn btn-icon btn-sm" onclick="switchRole()" title="Switch role" style="margin-right:8px">↶ Roles</button>
    <div class="conn-dot" id="xc-observer-dot"></div>
    <div class="header-title">XC Live Results</div>
    <div class="header-right"><span id="xc-observer-event-lbl" class="text-xs text-muted"></span></div>
  </div>
  <div class="content">
    <div class="clock" id="xc-observer-clock" style="font-size:2.8rem">0:00.00</div>
    <div id="xc-observer-places"></div>
    <div id="xc-observer-waiting" class="text-center text-muted mt-32">
      <div style="font-size:2.5rem"><svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='vertical-align:middle'><path d='M12 22V8M5 8l7-6 7 6M3 22h18M9 22V16h6v6'/></svg></div>
      <div class="mt-8">Waiting for race to start...</div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: VIDEO FINISH
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-video-finish" class="screen">
  <div class="header">
    <div class="conn-dot" id="vf-dot"></div><span id="vf-dot-lbl" style="font-size:0.65rem;font-weight:700;letter-spacing:.05em;color:var(--muted)"></span>
    <div>
      <div class="header-title">Video Finish</div>
      <div class="header-sub" id="vf-header-sub">Slit camera timing</div>
    </div>
    <div class="header-right">
      <span id="vf-badge" class="badge" style="display:none"></span>
      <button class="btn btn-icon btn-sm" onclick="vfExit()">\u2190 Back</button>
    </div>
  </div>
  <div class="content">

    <!-- Live camera with draggable slit line -->
    <canvas id="vf-live-canvas" class="vf-canvas" title="Drag to position slit line over finish line"></canvas>
    <video id="vf-video-preview" style="display:none" autoplay muted playsinline></video>

    <!-- Status bar -->
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
      <div id="vf-status-dot" style="width:10px;height:10px;border-radius:50%;background:var(--muted);flex-shrink:0"></div>
      <div id="vf-race-status" style="font-size:0.85rem;font-weight:600;color:var(--text);flex:1">Starting camera\u2026</div>
      <div id="vf-detect-count" style="font-size:0.78rem;color:var(--muted)"></div>
    </div>

    <!-- Slit image (finish line photo) -->
    <div class="vf-slit-wrap">
      <canvas id="vf-slit-canvas" class="vf-slit-display"></canvas>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:3px">
      <span id="vf-slit-lbl-left" style="font-size:0.7rem;color:var(--muted)">\u2190 earlier</span>
      <span style="font-size:0.7rem;color:var(--muted);font-weight:600">FINISH LINE PHOTO</span>
      <span id="vf-slit-lbl-right" style="font-size:0.7rem;color:var(--muted)">now \u2192</span>
    </div>

    <!-- Controls -->
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
      <button id="vf-cam-flip-btn" class="btn btn-secondary" style="font-size:0.8rem;padding:6px 10px" title="Switch camera" onclick="vfFlipCamera()">\u{1F4F7}\u2195</button>
      <div style="display:flex;align-items:center;gap:6px;flex:1">
        <span style="font-size:0.78rem;color:var(--muted);white-space:nowrap">Sensitivity</span>
        <input type="range" id="vf-sensitivity" min="1" max="10" value="6" style="flex:1;accent-color:var(--accent)">
        <span id="vf-sens-val" style="font-size:0.78rem;color:var(--muted);min-width:16px">6</span>
      </div>
      <button class="btn btn-secondary" style="font-size:0.78rem;padding:6px 10px" onclick="vfExportSlit()" title="Save finish line photo">\u{1F4BE} Photo</button>
    </div>

    <!-- Offset -->
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 10px;background:var(--surface-2);border-radius:8px">
      <div style="flex:1;font-size:0.76rem;color:var(--muted)">Camera lag offset (ms)</div>
      <input type="number" id="vf-offset-input" value="0" min="0" max="999"
        style="width:52px;padding:4px 6px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:0.85rem;text-align:center">
      <div style="font-size:0.76rem;color:var(--muted)">Progress top</div>
      <input type="number" id="vf-progress-input" value="2" min="1" max="8"
        style="width:42px;padding:4px 6px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:0.85rem;text-align:center">
    </div>

    <!-- Results -->
    <div style="margin-top:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">Finishes</div>
        <button class="btn btn-secondary" style="font-size:0.72rem;padding:4px 10px" onclick="vfManualAdd()">+ Add Manual</button>
      </div>
      <div id="vf-mark-list"><div class="text-muted text-sm text-center mt-8">Waiting for race\u2026</div></div>
    </div>

    <!-- Publish -->
    <div style="margin-top:16px">
      <button id="vf-publish-btn" class="btn btn-primary" style="width:100%" onclick="vfPublish()">Publish Times \u2192</button>
    </div>

  </div>
</div>
<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: JOIN PAGE (QR)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-share" class="screen">
  <div class="header">
    <div class="logo-badge">SP</div>
    <div class="header-title" id="share-school-name">Join Page</div>
    <div class="header-right">
      <button class="btn btn-icon btn-sm" onclick="enterRole('role')">\u2190 Back</button>
    </div>
  </div>
  <div class="content text-center">
    <div class="card">
      <div class="card-title">Scan to Join</div>
      <div class="qr-wrap"><div id="share-qr" style="width:180px;height:180px;padding:8px;background:#161b22;border-radius:6px;"></div></div>
      <div class="text-muted text-sm mt-8" id="share-carnival-name"></div>
    </div>
    <div class="card-title text-muted mt-8">Or enter this code</div>
    <div class="join-code" id="share-join-code"></div>
    <div class="text-muted text-xs mt-8">Open carnivaltiming.com and tap "Join Carnival"</div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     SCREEN: RESULTS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="screen-results" class="screen">
  <div class="header">
    <div class="logo-badge">SP</div>
    <div class="header-title">Results</div>
    <div class="header-right">
      <button class="btn btn-icon btn-sm" onclick="exportCSV()"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CSV</button>
    </div>
  </div>
  <div class="content">
    <div id="results-all" class="text-muted text-center mt-32">Loading...</div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     OVERLAYS
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="countdown-overlay">
  <div id="countdown-num" style="color:var(--text)">3</div>
  <div id="countdown-label">Get set...</div>
</div>

<div id="flash-overlay"></div>
<div id="tap-flash"></div>
<div id="toast"></div>

<div class="modal-backdrop" id="modal-bd">
  <div class="modal">
    <div class="modal-title" id="modal-ttl"></div>
    <div class="modal-body" id="modal-bdy"></div>
    <div class="stack" id="modal-btns-wrap"></div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     FIREBASE SDK
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<script>
    // Inlined QRCode generator (davidshimjs/qrcodejs 1.0.0) \u2014 no external dependency
    var QRCode;!function(){function a(a){this.mode=c.MODE_8BIT_BYTE,this.data=a,this.parsedData=[];for(var b=[],d=0,e=this.data.length;e>d;d++){var f=this.data.charCodeAt(d);f>65536?(b[0]=240|(1835008&f)>>>18,b[1]=128|(258048&f)>>>12,b[2]=128|(4032&f)>>>6,b[3]=128|63&f):f>2048?(b[0]=224|(61440&f)>>>12,b[1]=128|(4032&f)>>>6,b[2]=128|63&f):f>128?(b[0]=192|(1984&f)>>>6,b[1]=128|63&f):b[0]=f,this.parsedData=this.parsedData.concat(b)}this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function b(a,b){this.typeNumber=a,this.errorCorrectLevel=b,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function i(a,b){if(void 0==a.length)throw new Error(a.length+"/"+b);for(var c=0;c<a.length&&0==a[c];)c++;this.num=new Array(a.length-c+b);for(var d=0;d<a.length-c;d++)this.num[d]=a[d+c]}function j(a,b){this.totalCount=a,this.dataCount=b}function k(){this.buffer=[],this.length=0}function m(){return"undefined"!=typeof CanvasRenderingContext2D}function n(){var a=!1,b=navigator.userAgent;return/android/i.test(b)&&(a=!0,aMat=b.toString().match(/android ([0-9]\\.[0-9])/i),aMat&&aMat[1]&&(a=parseFloat(aMat[1]))),a}function r(a,b){for(var c=1,e=s(a),f=0,g=l.length;g>=f;f++){var h=0;switch(b){case d.L:h=l[f][0];break;case d.M:h=l[f][1];break;case d.Q:h=l[f][2];break;case d.H:h=l[f][3]}if(h>=e)break;c++}if(c>l.length)throw new Error("Too long data");return c}function s(a){var b=encodeURI(a).toString().replace(/\\%[0-9a-fA-F]{2}/g,"a");return b.length+(b.length!=a?3:0)}a.prototype={getLength:function(){return this.parsedData.length},write:function(a){for(var b=0,c=this.parsedData.length;c>b;b++)a.put(this.parsedData[b],8)}},b.prototype={addData:function(b){var c=new a(b);this.dataList.push(c),this.dataCache=null},isDark:function(a,b){if(0>a||this.moduleCount<=a||0>b||this.moduleCount<=b)throw new Error(a+","+b);return this.modules[a][b]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=new Array(this.moduleCount);for(var e=0;e<this.moduleCount;e++)this.modules[d][e]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(a,c),this.typeNumber>=7&&this.setupTypeNumber(a),null==this.dataCache&&(this.dataCache=b.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,b){for(var c=-1;7>=c;c++)if(!(-1>=a+c||this.moduleCount<=a+c))for(var d=-1;7>=d;d++)-1>=b+d||this.moduleCount<=b+d||(this.modules[a+c][b+d]=c>=0&&6>=c&&(0==d||6==d)||d>=0&&6>=d&&(0==c||6==c)||c>=2&&4>=c&&d>=2&&4>=d?!0:!1)},getBestMaskPattern:function(){for(var a=0,b=0,c=0;8>c;c++){this.makeImpl(!0,c);var d=f.getLostPoint(this);(0==c||a>d)&&(a=d,b=c)}return b},createMovieClip:function(a,b,c){var d=a.createEmptyMovieClip(b,c),e=1;this.make();for(var f=0;f<this.modules.length;f++)for(var g=f*e,h=0;h<this.modules[f].length;h++){var i=h*e,j=this.modules[f][h];j&&(d.beginFill(0,100),d.moveTo(i,g),d.lineTo(i+e,g),d.lineTo(i+e,g+e),d.lineTo(i,g+e),d.endFill())}return d},setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(var b=8;b<this.moduleCount-8;b++)null==this.modules[6][b]&&(this.modules[6][b]=0==b%2)},setupPositionAdjustPattern:function(){for(var a=f.getPatternPosition(this.typeNumber),b=0;b<a.length;b++)for(var c=0;c<a.length;c++){var d=a[b],e=a[c];if(null==this.modules[d][e])for(var g=-2;2>=g;g++)for(var h=-2;2>=h;h++)this.modules[d+g][e+h]=-2==g||2==g||-2==h||2==h||0==g&&0==h?!0:!1}},setupTypeNumber:function(a){for(var b=f.getBCHTypeNumber(this.typeNumber),c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[Math.floor(c/3)][c%3+this.moduleCount-8-3]=d}for(var c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[c%3+this.moduleCount-8-3][Math.floor(c/3)]=d}},setupTypeInfo:function(a,b){for(var c=this.errorCorrectLevel<<3|b,d=f.getBCHTypeInfo(c),e=0;15>e;e++){var g=!a&&1==(1&d>>e);6>e?this.modules[e][8]=g:8>e?this.modules[e+1][8]=g:this.modules[this.moduleCount-15+e][8]=g}for(var e=0;15>e;e++){var g=!a&&1==(1&d>>e);8>e?this.modules[8][this.moduleCount-e-1]=g:9>e?this.modules[8][15-e-1+1]=g:this.modules[8][15-e-1]=g}this.modules[this.moduleCount-8][8]=!a},mapData:function(a,b){for(var c=-1,d=this.moduleCount-1,e=7,g=0,h=this.moduleCount-1;h>0;h-=2)for(6==h&&h--;;){for(var i=0;2>i;i++)if(null==this.modules[d][h-i]){var j=!1;g<a.length&&(j=1==(1&a[g]>>>e));var k=f.getMask(b,d,h-i);k&&(j=!j),this.modules[d][h-i]=j,e--,-1==e&&(g++,e=7)}if(d+=c,0>d||this.moduleCount<=d){d-=c,c=-c;break}}}},b.PAD0=236,b.PAD1=17,b.createData=function(a,c,d){for(var e=j.getRSBlocks(a,c),g=new k,h=0;h<d.length;h++){var i=d[h];g.put(i.mode,4),g.put(i.getLength(),f.getLengthInBits(i.mode,a)),i.write(g)}for(var l=0,h=0;h<e.length;h++)l+=e[h].dataCount;if(g.getLengthInBits()>8*l)throw new Error("code length overflow. ("+g.getLengthInBits()+">"+8*l+")");for(g.getLengthInBits()+4<=8*l&&g.put(0,4);0!=g.getLengthInBits()%8;)g.putBit(!1);for(;;){if(g.getLengthInBits()>=8*l)break;if(g.put(b.PAD0,8),g.getLengthInBits()>=8*l)break;g.put(b.PAD1,8)}return b.createBytes(g,e)},b.createBytes=function(a,b){for(var c=0,d=0,e=0,g=new Array(b.length),h=new Array(b.length),j=0;j<b.length;j++){var k=b[j].dataCount,l=b[j].totalCount-k;d=Math.max(d,k),e=Math.max(e,l),g[j]=new Array(k);for(var m=0;m<g[j].length;m++)g[j][m]=255&a.buffer[m+c];c+=k;var n=f.getErrorCorrectPolynomial(l),o=new i(g[j],n.getLength()-1),p=o.mod(n);h[j]=new Array(n.getLength()-1);for(var m=0;m<h[j].length;m++){var q=m+p.getLength()-h[j].length;h[j][m]=q>=0?p.get(q):0}}for(var r=0,m=0;m<b.length;m++)r+=b[m].totalCount;for(var s=new Array(r),t=0,m=0;d>m;m++)for(var j=0;j<b.length;j++)m<g[j].length&&(s[t++]=g[j][m]);for(var m=0;e>m;m++)for(var j=0;j<b.length;j++)m<h[j].length&&(s[t++]=h[j][m]);return s};for(var c={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},d={L:1,M:0,Q:3,H:2},e={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var b=a<<10;f.getBCHDigit(b)-f.getBCHDigit(f.G15)>=0;)b^=f.G15<<f.getBCHDigit(b)-f.getBCHDigit(f.G15);return(a<<10|b)^f.G15_MASK},getBCHTypeNumber:function(a){for(var b=a<<12;f.getBCHDigit(b)-f.getBCHDigit(f.G18)>=0;)b^=f.G18<<f.getBCHDigit(b)-f.getBCHDigit(f.G18);return a<<12|b},getBCHDigit:function(a){for(var b=0;0!=a;)b++,a>>>=1;return b},getPatternPosition:function(a){return f.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,b,c){switch(a){case e.PATTERN000:return 0==(b+c)%2;case e.PATTERN001:return 0==b%2;case e.PATTERN010:return 0==c%3;case e.PATTERN011:return 0==(b+c)%3;case e.PATTERN100:return 0==(Math.floor(b/2)+Math.floor(c/3))%2;case e.PATTERN101:return 0==b*c%2+b*c%3;case e.PATTERN110:return 0==(b*c%2+b*c%3)%2;case e.PATTERN111:return 0==(b*c%3+(b+c)%2)%2;default:throw new Error("bad maskPattern:"+a)}},getErrorCorrectPolynomial:function(a){for(var b=new i([1],0),c=0;a>c;c++)b=b.multiply(new i([1,g.gexp(c)],0));return b},getLengthInBits:function(a,b){if(b>=1&&10>b)switch(a){case c.MODE_NUMBER:return 10;case c.MODE_ALPHA_NUM:return 9;case c.MODE_8BIT_BYTE:return 8;case c.MODE_KANJI:return 8;default:throw new Error("mode:"+a)}else if(27>b)switch(a){case c.MODE_NUMBER:return 12;case c.MODE_ALPHA_NUM:return 11;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 10;default:throw new Error("mode:"+a)}else{if(!(41>b))throw new Error("type:"+b);switch(a){case c.MODE_NUMBER:return 14;case c.MODE_ALPHA_NUM:return 13;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 12;default:throw new Error("mode:"+a)}}},getLostPoint:function(a){for(var b=a.getModuleCount(),c=0,d=0;b>d;d++)for(var e=0;b>e;e++){for(var f=0,g=a.isDark(d,e),h=-1;1>=h;h++)if(!(0>d+h||d+h>=b))for(var i=-1;1>=i;i++)0>e+i||e+i>=b||(0!=h||0!=i)&&g==a.isDark(d+h,e+i)&&f++;f>5&&(c+=3+f-5)}for(var d=0;b-1>d;d++)for(var e=0;b-1>e;e++){var j=0;a.isDark(d,e)&&j++,a.isDark(d+1,e)&&j++,a.isDark(d,e+1)&&j++,a.isDark(d+1,e+1)&&j++,(0==j||4==j)&&(c+=3)}for(var d=0;b>d;d++)for(var e=0;b-6>e;e++)a.isDark(d,e)&&!a.isDark(d,e+1)&&a.isDark(d,e+2)&&a.isDark(d,e+3)&&a.isDark(d,e+4)&&!a.isDark(d,e+5)&&a.isDark(d,e+6)&&(c+=40);for(var e=0;b>e;e++)for(var d=0;b-6>d;d++)a.isDark(d,e)&&!a.isDark(d+1,e)&&a.isDark(d+2,e)&&a.isDark(d+3,e)&&a.isDark(d+4,e)&&!a.isDark(d+5,e)&&a.isDark(d+6,e)&&(c+=40);for(var k=0,e=0;b>e;e++)for(var d=0;b>d;d++)a.isDark(d,e)&&k++;var l=Math.abs(100*k/b/b-50)/5;return c+=10*l}},g={glog:function(a){if(1>a)throw new Error("glog("+a+")");return g.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;a>=256;)a-=255;return g.EXP_TABLE[a]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},h=0;8>h;h++)g.EXP_TABLE[h]=1<<h;for(var h=8;256>h;h++)g.EXP_TABLE[h]=g.EXP_TABLE[h-4]^g.EXP_TABLE[h-5]^g.EXP_TABLE[h-6]^g.EXP_TABLE[h-8];for(var h=0;255>h;h++)g.LOG_TABLE[g.EXP_TABLE[h]]=h;i.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var b=new Array(this.getLength()+a.getLength()-1),c=0;c<this.getLength();c++)for(var d=0;d<a.getLength();d++)b[c+d]^=g.gexp(g.glog(this.get(c))+g.glog(a.get(d)));return new i(b,0)},mod:function(a){if(this.getLength()-a.getLength()<0)return this;for(var b=g.glog(this.get(0))-g.glog(a.get(0)),c=new Array(this.getLength()),d=0;d<this.getLength();d++)c[d]=this.get(d);for(var d=0;d<a.getLength();d++)c[d]^=g.gexp(g.glog(a.get(d))+b);return new i(c,0).mod(a)}},j.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],j.getRSBlocks=function(a,b){var c=j.getRsBlockTable(a,b);if(void 0==c)throw new Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+b);for(var d=c.length/3,e=[],f=0;d>f;f++)for(var g=c[3*f+0],h=c[3*f+1],i=c[3*f+2],k=0;g>k;k++)e.push(new j(h,i));return e},j.getRsBlockTable=function(a,b){switch(b){case d.L:return j.RS_BLOCK_TABLE[4*(a-1)+0];case d.M:return j.RS_BLOCK_TABLE[4*(a-1)+1];case d.Q:return j.RS_BLOCK_TABLE[4*(a-1)+2];case d.H:return j.RS_BLOCK_TABLE[4*(a-1)+3];default:return void 0}},k.prototype={get:function(a){var b=Math.floor(a/8);return 1==(1&this.buffer[b]>>>7-a%8)},put:function(a,b){for(var c=0;b>c;c++)this.putBit(1==(1&a>>>b-c-1))},getLengthInBits:function(){return this.length},putBit:function(a){var b=Math.floor(this.length/8);this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128>>>this.length%8),this.length++}};var l=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],o=function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){function g(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg",a);for(var d in b)b.hasOwnProperty(d)&&c.setAttribute(d,b[d]);return c}var b=this._htOption,c=this._el,d=a.getModuleCount();Math.floor(b.width/d),Math.floor(b.height/d),this.clear();var h=g("svg",{viewBox:"0 0 "+String(d)+" "+String(d),width:"100%",height:"100%",fill:b.colorLight});h.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),c.appendChild(h),h.appendChild(g("rect",{fill:b.colorDark,width:"1",height:"1",id:"template"}));for(var i=0;d>i;i++)for(var j=0;d>j;j++)if(a.isDark(i,j)){var k=g("use",{x:String(i),y:String(j)});k.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),h.appendChild(k)}},a.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},a}(),p="svg"===document.documentElement.tagName.toLowerCase(),q=p?o:m()?function(){function a(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function d(a,b){var c=this;if(c._fFail=b,c._fSuccess=a,null===c._bSupportDataURI){var d=document.createElement("img"),e=function(){c._bSupportDataURI=!1,c._fFail&&_fFail.call(c)},f=function(){c._bSupportDataURI=!0,c._fSuccess&&c._fSuccess.call(c)};return d.onabort=e,d.onerror=e,d.onload=f,d.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",void 0}c._bSupportDataURI===!0&&c._fSuccess?c._fSuccess.call(c):c._bSupportDataURI===!1&&c._fFail&&c._fFail.call(c)}if(this._android&&this._android<=2.1){var b=1/window.devicePixelRatio,c=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(a,d,e,f,g,h,i,j){if("nodeName"in a&&/img/i.test(a.nodeName))for(var l=arguments.length-1;l>=1;l--)arguments[l]=arguments[l]*b;else"undefined"==typeof j&&(arguments[1]*=b,arguments[2]*=b,arguments[3]*=b,arguments[4]*=b);c.apply(this,arguments)}}var e=function(a,b){this._bIsPainted=!1,this._android=n(),this._htOption=b,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=b.width,this._elCanvas.height=b.height,a.appendChild(this._elCanvas),this._el=a,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=null};return e.prototype.draw=function(a){var b=this._elImage,c=this._oContext,d=this._htOption,e=a.getModuleCount(),f=d.width/e,g=d.height/e,h=Math.round(f),i=Math.round(g);b.style.display="none",this.clear();for(var j=0;e>j;j++)for(var k=0;e>k;k++){var l=a.isDark(j,k),m=k*f,n=j*g;c.strokeStyle=l?d.colorDark:d.colorLight,c.lineWidth=1,c.fillStyle=l?d.colorDark:d.colorLight,c.fillRect(m,n,f,g),c.strokeRect(Math.floor(m)+.5,Math.floor(n)+.5,h,i),c.strokeRect(Math.ceil(m)-.5,Math.ceil(n)-.5,h,i)}this._bIsPainted=!0},e.prototype.makeImage=function(){this._bIsPainted&&d.call(this,a)},e.prototype.isPainted=function(){return this._bIsPainted},e.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},e.prototype.round=function(a){return a?Math.floor(1e3*a)/1e3:a},e}():function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){for(var b=this._htOption,c=this._el,d=a.getModuleCount(),e=Math.floor(b.width/d),f=Math.floor(b.height/d),g=['<table style="border:0;border-collapse:collapse;">'],h=0;d>h;h++){g.push("<tr>");for(var i=0;d>i;i++)g.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+e+"px;height:"+f+"px;background-color:"+(a.isDark(h,i)?b.colorDark:b.colorLight)+';"></td>');g.push("</tr>")}g.push("</table>"),c.innerHTML=g.join("");var j=c.childNodes[0],k=(b.width-j.offsetWidth)/2,l=(b.height-j.offsetHeight)/2;k>0&&l>0&&(j.style.margin=l+"px "+k+"px")},a.prototype.clear=function(){this._el.innerHTML=""},a}();QRCode=function(a,b){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:d.H},"string"==typeof b&&(b={text:b}),b)for(var c in b)this._htOption[c]=b[c];"string"==typeof a&&(a=document.getElementById(a)),this._android=n(),this._el=a,this._oQRCode=null,this._oDrawing=new q(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(a){this._oQRCode=new b(r(a,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(a),this._oQRCode.make(),this._el.title=a,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=d}();
  <\/script>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
     APP SCRIPT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<script>
'use strict';

// \u2500\u2500 WebSocket shim (replaces Firebase + Realtime DB) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// \u2500\u2500 WebSocket shim (replaces Firebase Realtime Database) \u2500\u2500\u2500\u2500\u2500\u2500
// v4: hibernatable DO backend + seq-based gap detection
const WS_HOST = 'ws.carnivaltiming.com'; // Add CNAME ws\u2192carnival-timing-ws.pgallivan.workers.dev in CF dashboard
let _ws=null,_wsCode=null,_wsReady=false,_reqId=0,_msgBuf=[];
let _pendingReqs=new Map(), _subscriptions=new Map(), _reconnTimer=null;
// seq tracking: last seq seen per path; if incoming seq > lastSeq+1 we missed
// updates \u2014 re-subscribe to force a fresh snapshot from the DO.
const _lastSeq=new Map();

function _nextId(){ return String(++_reqId); }

// \u2500\u2500 Pending-split safety net \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function _savePendingSplit(lane, key, payload) {
  try {
    const q = JSON.parse(localStorage.getItem('_pendingSplits') || '[]');
    if (!q.find(e => e.key === key)) q.push({ lane, key, payload, carnivalCode });
    localStorage.setItem('_pendingSplits', JSON.stringify(q));
  } catch(e) {}
}
function _clearPendingSplit(key) {
  try {
    const q = JSON.parse(localStorage.getItem('_pendingSplits') || '[]');
    localStorage.setItem('_pendingSplits', JSON.stringify(q.filter(e => e.key !== key)));
  } catch(e) {}
}
async function _retryPendingSplits() {
  try {
    const q = JSON.parse(localStorage.getItem('_pendingSplits') || '[]');
    if (!q.length) return;
    for (const e of q) {
      if (e.carnivalCode !== carnivalCode) continue;
      try {
        await cRef(\`race/current/splits/\${e.lane}/\${e.key}\`).set(e.payload);
        _clearPendingSplit(e.key);
        toast('Saved split sent \u2713');
      } catch(err) {}
    }
  } catch(e) {}
}

var _reconnAttempts=0, _handshakeTimer=null;
function _wsBackoff(){
  // Exponential backoff with jitter: 500 -> 1000 -> 2000 -> 4000 -> 8000 (cap), +/-30% jitter
  var base=Math.min(8000, 500*Math.pow(2, Math.min(_reconnAttempts, 4)));
  var jitter=base*0.6*(Math.random()-0.5);
  return Math.max(250, Math.round(base+jitter));
}
function _wsConnectTo(code){
  if(_ws && _wsCode===code && (_ws.readyState===0||_ws.readyState===1)) return;
  if(_ws){try{_ws.onclose=null;_ws.close();}catch{}}
  if(_handshakeTimer){clearTimeout(_handshakeTimer);_handshakeTimer=null;}
  _wsCode=code; _wsReady=false;
  _ws=new WebSocket(\`wss://\${WS_HOST}/ws/\${code}\`);
  // Handshake watchdog: if no onopen in 8s, force-close + trigger backoff reconnect
  _handshakeTimer=setTimeout(()=>{
    if(!_wsReady){
      try{_ws.onclose=null;_ws.onerror=null;_ws.close();}catch{}
      _wsReady=false; _notifyConn(false);
      _reconnAttempts++;
      if(_wsCode) _reconnTimer=setTimeout(()=>_wsConnectTo(_wsCode), _wsBackoff());
    }
  }, 8000);
  _ws.onopen=()=>{
    _wsReady=true; _reconnAttempts=0;
    clearTimeout(_reconnTimer); clearTimeout(_handshakeTimer); _handshakeTimer=null;
    // Replay any writes buffered while disconnected
    _msgBuf.splice(0).forEach(m=>_ws.send(m));
    // Retry any splits that were lost during a previous disconnect
    setTimeout(_retryPendingSplits, 300);
    // Re-subscribe to all paths \u2014 DO sends a fresh snapshot for each,
    // which handles any gap accumulated during the disconnection.
    for(const p of _subscriptions.keys()) if(!p.startsWith('__'))
      _ws.send(JSON.stringify({type:'subscribe',path:p}));
    _notifyConn(true);
  };
  _ws.onclose=_ws.onerror=()=>{
    if(_handshakeTimer){clearTimeout(_handshakeTimer);_handshakeTimer=null;}
    _wsReady=false; _notifyConn(false);
    for(const [,r] of _pendingReqs){clearTimeout(r.timer);r.reject(new Error('ws closed'));}
    _pendingReqs.clear();
    _reconnAttempts++;
    if(_wsCode) _reconnTimer=setTimeout(()=>_wsConnectTo(_wsCode), _wsBackoff());
  };
  _ws.onmessage=({data})=>{
    const msg=JSON.parse(data);
    // Resolve pending request (get/set/update/push/etc.)
    if(msg.id && _pendingReqs.has(msg.id)){
      const r=_pendingReqs.get(msg.id);
      clearTimeout(r.timer);_pendingReqs.delete(msg.id);r.resolve(msg);
    }
    if(msg.type==='snapshot' && msg.path!=null){
      // Gap detection: if seq jumped, we re-subscribe to get authoritative state.
      // (Snapshots already carry full state so the re-subscribe snapshot fixes it.)
      if(msg.seq!=null){
        const last=_lastSeq.get(msg.path);
        if(last!=null && msg.seq > last+1 && _wsReady){
          // Gap detected \u2014 re-subscribe immediately for a guaranteed fresh snapshot
          _ws.send(JSON.stringify({type:'subscribe',path:msg.path}));
        }
        _lastSeq.set(msg.path, msg.seq);
      }
      const cbs=_subscriptions.get(msg.path);
      if(cbs){const s=_snap(msg.path,msg.data);cbs.forEach(c=>c(s));}
    }
  };
}
function _wsReady2(){ return new Promise((res,rej)=>{ if(_wsReady)return res(); const t=setTimeout(()=>rej(new Error('ws timeout')),8000); const iv=setInterval(()=>{if(_wsReady){clearTimeout(t);clearInterval(iv);res();}},50); }); }
function _notifyConn(v){
  const banner = document.getElementById('reconnect-banner');
  if (banner) banner.style.display = v ? 'none' : 'block';
  const cbs=_subscriptions.get('__connected__');if(cbs){const s=_snap('connected',v);cbs.forEach(c=>c(s));}
}
function _snap(path,data){ return {val:()=>data, exists:()=>data!=null, key:path.split('/').pop()}; }
function _send(msg){ return new Promise((res,rej)=>{ const id=_nextId();msg.id=id;const str=JSON.stringify(msg);const timer=setTimeout(()=>{_pendingReqs.delete(id);rej(new Error('ws timeout'));},10000);_pendingReqs.set(id,{resolve:res,reject:rej,timer}); if(_wsReady)_ws.send(str);else _msgBuf.push(str); }); }
function _ref(path){ return { once:()=>_send({type:'get',path}).then(r=>_snap(path,r.data)), set:(v)=>_send({type:'set',path,data:v}), update:(v)=>_send({type:'update',path,data:v}), push:(v)=>_send({type:'push',path,data:v}).then(r=>({key:r.key})), remove:()=>_send({type:'remove',path}), on:(ev,cb)=>{ if(!_subscriptions.has(path))_subscriptions.set(path,new Set()); _subscriptions.get(path).add(cb); if(_wsReady)_ws.send(JSON.stringify({type:'subscribe',path})); _send({type:'get',path}).then(r=>cb(_snap(path,r.data))).catch(()=>{}); }, off:()=>{ _subscriptions.delete(path); if(_wsReady)_ws.send(JSON.stringify({type:'unsubscribe',path})); } }; }
const firebase={database:{ServerValue:{TIMESTAMP:{'.sv':'timestamp'}}}};
const db={ref:(path)=>{
  if(path==='.info/serverTimeOffset') return {once:async()=>{const r=await _send({type:'servertime'});return _snap(path,r.ts-Date.now());}};
  if(path==='.info/connected') return {on:(ev,cb)=>{ if(!_subscriptions.has('__connected__'))_subscriptions.set('__connected__',new Set()); _subscriptions.get('__connected__').add(cb); cb(_snap(path,_wsReady)); }};
  return _ref(path);
}};
const __fbAuthReady = Promise.resolve();

// \u2500\u2500 State \u2500\u2500
let _carnivalCodeVal = '';
Object.defineProperty(window, 'carnivalCode', {
  get: () => _carnivalCodeVal,
  set: (v) => { _carnivalCodeVal = v; if(v) _wsConnectTo(v); }
});
let carnivalMeta = null;
let myName = localStorage.getItem('fl_name') || '';
let myId   = localStorage.getItem('fl_id') || genId(8);
localStorage.setItem('fl_id', myId);
let myLane = 0;
let serverOffset = 0;
let wakeLock = null;
let rafId = null;
let raceState = null;
let xcState   = null;
let adminGender = 'boys';
let xcGender    = 'boys';
let selSport = 'track';
let selTier  = 'school';
let activeListeners = [];
let countdownRunning = false;
let dqSet = new Set();
let dnsSet = new Set();
let dnfSet = new Set();
let programIndex = 0;
// Program builder rows
const programRows = [];
function addProgramRow(age='', gender='boys', event='') {
  const id = Date.now() + Math.random();
  programRows.push(id);
  const container = document.getElementById('program-rows');
  if (!container) return;
  const row = document.createElement('div');
  row.id = \`prog-row-\${id}\`;
  row.style.cssText = 'display:grid;grid-template-columns:1fr 90px 1fr 28px;gap:5px;margin-bottom:6px;align-items:center';
  row.innerHTML = \`<input class="prog-age" data-pid="\${id}" placeholder="9 Years" value="\${age}"
      style="padding:7px 8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:.82rem;width:100%">
    <select class="prog-gender" data-pid="\${id}"
      style="padding:7px 6px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:.82rem;width:100%">
      <option value="boys" \${gender==='boys'?'selected':''}>Boys</option>
      <option value="girls" \${gender==='girls'?'selected':''}>Girls</option>
      <option value="mixed" \${gender==='mixed'?'selected':''}>Mixed</option>
    </select>
    <input class="prog-event" data-pid="\${id}" placeholder="100m" value="\${event}"
      style="padding:7px 8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:.82rem;width:100%">
    <button type="button" onclick="removeProgramRow(\${id})"
      style="background:none;border:none;color:var(--muted);font-size:1rem;cursor:pointer;padding:4px;border-radius:6px">\u2715</button>\`;
  container.appendChild(row);
}
function removeProgramRow(id) {
  const idx = programRows.indexOf(id);
  if (idx > -1) programRows.splice(idx, 1);
  document.getElementById(\`prog-row-\${id}\`)?.remove();
}
function getProgramData() {
  return programRows.map(id => ({
    age: document.querySelector(\`.prog-age[data-pid="\${id}"]\`)?.value.trim()||'',
    gender: document.querySelector(\`.prog-gender[data-pid="\${id}"]\`)?.value||'boys',
    event: document.querySelector(\`.prog-event[data-pid="\${id}"]\`)?.value.trim()||''
  })).filter(r => r.age && r.event);
} // lanes DQ'd in current done panel

// \u2500\u2500 Event Lists \u2500\u2500
const EVENTS = {
  track: ['100m Sprint','200m Sprint','400m','800m','1500m','4\xD7100m Relay','Long Jump','Triple Jump','High Jump','Shot Put','Discus','Javelin'],
  swim:  ['50m Freestyle','50m Backstroke','50m Breaststroke','50m Butterfly','100m Freestyle','100m Backstroke','100m Breaststroke','200m Freestyle','4\xD750m Freestyle Relay','4\xD750m Medley Relay'],
  xc:    ['Cross Country 2km','Cross Country 3km','Cross Country 4km','Cross Country 5km','Fun Run 1km','Fun Run 2km','Fun Run 3km'],
  mixed: ['100m Sprint','200m Sprint','400m','800m','50m Freestyle','50m Backstroke','Cross Country 2km','Cross Country 3km','Long Jump','High Jump']
};
const AGE_GROUPS = ['9 Years','10 Years','11 Years','12/13 Years','Open','Year 3/4','Year 5/6','Year 3\u20136'];
const LANE_COUNT = 8;

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// UTILITIES
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function genId(n=8) {
  return Math.random().toString(36).substring(2, 2+n).toUpperCase();
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function fmtMs(ms) {
  if (ms == null || ms < 0) return '\u2014';
  const totalCs = Math.floor(ms / 10);
  const cs  = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  if (min > 0) return \`\${min}:\${pad(sec)}.\${pad(cs)}\`;
  return \`\${sec}.\${pad(cs)}\`;
}

function fmtSec(ms) {
  if (ms == null) return '\u2014';
  return (ms / 1000).toFixed(2) + 's';
}

function pad(n) { return String(n).padStart(2,'0'); }

function nowServer() { return Date.now() + serverOffset; }

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function trimmedMean(values) {
  if (!values || values.length === 0) return null;
  if (values.length <= 2) return values.reduce((a,b)=>a+b,0)/values.length;
  const sorted = [...values].sort((a,b)=>a-b);
  const inner = sorted.slice(1,-1);
  return inner.reduce((a,b)=>a+b,0)/inner.length;
}

function confidenceFor(splitsObj) {
  const vals = Object.values(splitsObj||{}).map(s=>s.elapsedMs).filter(Boolean);
  if (vals.length === 0) return { cls:'LOW', label:'No timers' };
  if (vals.length === 1) return { cls:'CHECK', label:'1 timer' };
  const spread = Math.max(...vals) - Math.min(...vals);
  if (vals.length >= 3 && spread < 300) return { cls:'HIGH', label:'HIGH' };
  if (vals.length >= 2 && spread < 600) return { cls:'OK', label:'OK' };
  if (spread < 1500) return { cls:'CHECK', label:'CHECK' };
  return { cls:'LOW', label:'DISAGREE' };
}

function fbEnc(s) {
  return String(s).replace(/\\./g,'__D__').replace(/\\//g,'__S__')
    .replace(/\\[/g,'__LB__').replace(/\\]/g,'__RB__')
    .replace(/#/g,'__H__').replace(/\\$/g,'__$__');
}

// \u2500\u2500 UI helpers \u2500\u2500
function showScreen(id) {
  // Stop XC camera if we're navigating away from XC screens
  // (saves battery + turns off the camera light + frees the device)
  const _leavingXc = (id === 'home' || id === 'admin' || id === 'observer');
  if (_leavingXc && typeof xcStopCamera === 'function') {
    try { xcStopCamera(); } catch(_) {}
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) { el.classList.add('active'); window.scrollTo(0,0); }
}
// xcStopCamera: hard-stop the XC live camera stream + detect loop.
// Safe to call even when there's no active camera. Idempotent.
function xcStopCamera() {
  try { if (xcDetectInterval) { clearInterval(xcDetectInterval); xcDetectInterval = null; } } catch(_) {}
  try {
    if (xcCamStream) {
      xcCamStream.getTracks().forEach(t => { try { t.stop(); } catch(_) {} });
    }
  } catch(_) {}
  xcCamStream = null;
  // Clear srcObject so the camera light goes off immediately on iOS Safari
  try { var v = document.getElementById('xc-cam'); if (v) { v.srcObject = null; } } catch(_) {}
  try { var v2 = document.getElementById('xc-cap'); if (v2) { var ctx = v2.getContext && v2.getContext('2d'); if (ctx) ctx.clearRect(0,0,v2.width,v2.height); } } catch(_) {}
  try { xcPrevSamples = null; } catch(_) {}
}
// Also stop when the page is hidden (tab switch / lock screen) to spare battery
document.addEventListener('visibilitychange', function(){
  if (document.hidden) { try { xcStopCamera(); } catch(_) {} }
});
// And on page unload
window.addEventListener('pagehide', function(){ try { xcStopCamera(); } catch(_) {} });

function toast(msg, dur=2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), dur);
}

function modal(title, body, buttons) {
  document.getElementById('modal-ttl').textContent = title;
  document.getElementById('modal-bdy').textContent = body;
  const wrap = document.getElementById('modal-btns-wrap');
  wrap.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls||'btn-secondary');
    btn.textContent = b.label;
    btn.onclick = () => { closeModal(); b.fn && b.fn(); };
    wrap.appendChild(btn);
  });
  document.getElementById('modal-bd').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-bd').classList.remove('active');
}

function vibrate(pat) { try { navigator.vibrate && navigator.vibrate(pat); } catch(e){} }

function flash(type, dur=450) {
  const el = document.getElementById('flash-overlay');
  el.className = type;
  setTimeout(()=>el.className='', dur);
}

function tapFlash() {
  const el = document.getElementById('tap-flash');
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 180);
}

// \u2500\u2500 Clock sync \u2500\u2500
async function syncClock() {
  const snap = await db.ref('.info/serverTimeOffset').once('value');
  serverOffset = snap.val() || 0;
}

async function getServerTime() {
  const snap = await db.ref('.info/serverTimeOffset').once('value');
  return Date.now() + (snap.val() || 0);
}

// \u2500\u2500 Wake lock \u2500\u2500
async function requestWakeLock() {
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); }
  catch(e){}
}

// Re-acquire wake lock when tab comes back to foreground
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
});

// Warn before closing if race is live
window.addEventListener('beforeunload', e => {
  if (raceState?.state === 'live') {
    e.preventDefault();
    e.returnValue = 'A race is currently live \u2014 timing data may be lost if you leave.';
  }
});

// \u2500\u2500 Firebase helpers \u2500\u2500
function cRef(path) { return db.ref(path); }

function cleanListeners() {
  activeListeners.forEach(fn=>fn());
  activeListeners = [];
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

function watchConn(dotId) {
  db.ref('.info/connected').on('value', snap => {
    const el  = document.getElementById(dotId);
    const txt = document.getElementById(dotId + '-lbl');
    const live = snap.val() === true;
    if (el)  el.classList.toggle('live', live);
    if (txt) { txt.textContent = live ? 'LIVE' : 'OFFLINE'; txt.style.color = live ? 'var(--success)' : 'var(--danger)'; }
  });
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// SETUP SCREEN
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function selectSport(s) {
  selSport = s;
  document.querySelectorAll('.sport-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(\`.sport-btn[data-sport="\${s}"]\`).classList.add('active');
}

function selectTier(t) {
  selTier = t;
  document.querySelectorAll('.pill[data-tier]').forEach(p=>p.classList.remove('active'));
  document.querySelector(\`.pill[data-tier="\${t}"]\`).classList.add('active');
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// DEMO MODE
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const DEMO_ATHLETES = ['Aiden Smith','Ben Carter','Chris Lee','Dana Park','Emma White','Finn Taylor','Gus Brown','Harper Jones'];

async function startDemo() {
  toast('Setting up demo\u2026');
  let code, snap;
  do {
    code = genCode();
    carnivalCode = code; await _wsReady2(); snap = await db.ref('meta').once('value');
  } while (snap.exists());

  carnivalCode = code;
  carnivalMeta = {
    school: 'Demo Carnival',
    name: '100m Sprint Demo',
    sport: 'track',
    tier: 'school',
    colour: '#f59e0b',
    isDemo: true,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };
  applyAccent('#f59e0b');
  await db.ref('meta').set(carnivalMeta);
  localStorage.setItem('fl_last_code', code);

  showScreen('admin');
  initAdminView();

  // Pre-fill athlete names and scroll demo banner into view
  setTimeout(() => {
    document.querySelectorAll('.admin-lane-name-input').forEach((inp, i) => {
      if (DEMO_ATHLETES[i]) inp.value = DEMO_ATHLETES[i];
    });
    const banner = document.getElementById('admin-demo-banner');
    if (banner) banner.scrollIntoView({behavior:'smooth', block:'start'});
    toast(\`Demo ready \u2014 \${code}. Share the code or QR with your timers, then arm the race.\`);
  }, 300);
}

function copyDemoCode() {
  const code = document.getElementById('demo-code-display').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(() => toast('Code copied'));
  } else {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = code; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    toast('Code copied');
  }
}

function initDemoBanner() {
  if (!carnivalMeta?.isDemo) return;
  const banner = document.getElementById('admin-demo-banner');
  if (!banner) return;
  banner.classList.remove('hidden');

  const codeEl = document.getElementById('demo-code-display');
  if (codeEl) codeEl.textContent = carnivalCode;

  const joinUrl = \`https://carnivaltiming.com/?join=\${carnivalCode}\`;
  const qrEl = document.getElementById('demo-qr-canvas');
  if (qrEl && typeof QRCode !== 'undefined') {
    qrEl.innerHTML = '';
    new QRCode(qrEl, { text: joinUrl, width: 128, height: 128,
      colorDark: '#000000', colorLight: '#ffffff' });
  }
}

async function createCarnival() {
  const school = document.getElementById('setup-school').value.trim();
  const name   = document.getElementById('setup-name').value.trim();
  if (!school || !name) { toast('Enter school name and event name'); return; }

  const colour = document.getElementById('setup-colour').value.trim() || '#14b8a6';
  applyAccent(colour);

  // Find unique code
  let code, snap;
  do {
    code = genCode();
    carnivalCode = code; await _wsReady2(); snap = await db.ref('meta').once('value');
  } while (snap.exists());

  carnivalCode = code;
  const housesRaw = document.getElementById('setup-houses')?.value.trim()||'';
  const houses = housesRaw ? housesRaw.split(',').map(h=>h.trim()).filter(Boolean) : [];
  const program = getProgramData();
  // Auto-generate Staff PIN — shared verbally with timing volunteers to gate Timer/Starter/Marshal/Video roles
  const _staffPinAuto = String(Math.floor(1000 + Math.random()*9000));
  carnivalMeta = { school, name, sport:selSport, tier:selTier, colour,
    houses, program,
    staffPin: _staffPinAuto,
    createdAt: firebase.database.ServerValue.TIMESTAMP };

  await db.ref('meta').set(carnivalMeta);
  localStorage.setItem('fl_last_code', code);

  toast(\`Carnival created \u2014 \${code}\`);
  showRolePicker();
  // Admin auto-navigates to their control panel
  setTimeout(() => enterRole('admin'), 600);
}

function applyAccent(colour) {
  if (!colour || !/^#[0-9a-fA-F]{3,6}$/.test(colour)) return;
  document.documentElement.style.setProperty('--accent', colour);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// JOIN
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function joinCarnival(roleHint) {
  const code = document.getElementById('join-code-input').value.trim().toUpperCase();
  const name = document.getElementById('join-name-input').value.trim();
  const isObserver = roleHint === 'observer';
  if (code.length < 4) { toast('Enter 4-letter code'); return; }
  if (!name && !isObserver) { toast('Enter your name'); return; }

  carnivalCode = code; await _wsReady2(); const snap = await db.ref('meta').once('value');
  const errEl = document.getElementById('join-error');
  if (!snap.exists()) {
    errEl.textContent = 'Carnival not found \u2014 check the code';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  carnivalCode = code;
  carnivalMeta = snap.val();
  myName = name;
  localStorage.setItem('fl_name', name);
  localStorage.setItem('fl_last_code', code);
  if (carnivalMeta.colour) applyAccent(carnivalMeta.colour);

  if (isObserver) { enterRole('observer'); return; }
  showRolePicker();
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// ROLE PICKER
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function showRolePicker() {
  document.getElementById('role-school-name').textContent = carnivalMeta?.school || 'Carnival Timing';
  document.getElementById('role-carnival-name').textContent = carnivalMeta?.name || '';
  document.getElementById('role-joined-name').textContent = carnivalMeta?.name || '';
  document.getElementById('role-joined-code').textContent = \`Code: \${carnivalCode}\`;
  const expiresNote = document.getElementById('role-expires-note');
  if (expiresNote && carnivalMeta?.expiresAt) {
    const daysLeft = Math.ceil((carnivalMeta.expiresAt - Date.now()) / 86400000);
    if (daysLeft > 0) {
      expiresNote.textContent = \`Expires in \${daysLeft} day\${daysLeft===1?'':'s'}\`;
      expiresNote.style.display = '';
    } else {
      expiresNote.textContent = 'This carnival has expired';
      expiresNote.style.color = 'var(--warn)';
      expiresNote.style.display = '';
    }
  }

  const sport = carnivalMeta?.sport || 'track';
  const grid = document.getElementById('role-grid');
  const roles = [];

  if (['track','swim','mixed'].includes(sport)) {
    roles.push({ id:'timer',    icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>', label:'Timer',        desc:'Time a lane' });
    roles.push({ id:'admin',    icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>', label:'Race Control', desc:'Arm & manage races' });
    roles.push({ id:'starter',  icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>', label:'Starter',      desc:'Fire the gun' });
    roles.push({ id:'observer', icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>', label:'Observer',     desc:'Watch live results' });
  }
  if (['xc','mixed'].includes(sport)) {
    roles.push({ id:'marshal',   icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M12 22V8M5 8l7-6 7 6M3 22h18M9 22V16h6v6"/></svg>', label:'Finish Marshal', desc:'Tap each finisher',     full: sport==="xc" });
    roles.push({ id:'admin-xc',  icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>', label:'XC Control',    desc:'Arm & manage XC races', full: sport==='xc' });
    roles.push({ id:'observer-xc',icon:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',label:'XC Observer',   desc:'Watch finish order',    full: sport==='xc' });
  }
  if (['track','swim','mixed'].includes(sport)) {
    roles.push({ id:'video-finish', icon:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>', label:'Video Finish', desc:'Slit camera \u2014 pro finish line photo + auto-detect + Roster pre-load', full:true });
  }
  roles.push({ id:'share',   icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>', label:'Join Page',  desc:'QR code for participants', full:true });
  roles.push({ id:'results', icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', label:'Results',    desc:'View all results',          full:true });

  grid.innerHTML = roles.map(r => \`
    <div class="role-card\${r.full?' full':''}" onclick="enterRole('\${r.id}')">
      <div class="r-icon">\${r.icon}</div>
      <div class="r-label">\${r.label}</div>
      <div class="r-desc">\${r.desc}</div>
    </div>\`).join('');

  showScreen('role');
}


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// ADMIN PIN
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function _checkAdminPin(onSuccess) {
  const storedPin = carnivalMeta?.adminPin;
  if (!storedPin) {
    // No PIN set client-side \u2014 server will auto-grant; offer to set one after entry
    _send({type:'auth', pin: null})
      .then(r => { if (r.type === 'auth_ok') { onSuccess(); _offerSetPin(); } })
      .catch(() => { onSuccess(); _offerSetPin(); }); // fallback if WS not ready
    return;
  }
  _pinModal('Enter Admin PIN', async (entered) => {
    if (entered === null) return; // cancelled
    try {
      const r = await _send({type: 'auth', pin: String(entered)});
      if (r.type === 'auth_ok') {
        onSuccess();
      } else if (r.message === 'too_many_attempts') {
        toast('Too many failed attempts \u2014 reconnect and try again.');
      } else {
        toast('Incorrect PIN');
      }
    } catch {
      toast('Connection error \u2014 try again.');
    }
  });
}

async function _offerSetPin() {
  // Genuinely non-blocking — top banner, dismissible, auto-fades after 20s
  setTimeout(() => {
    if (carnivalMeta?.adminPin) return; // already set
    if (document.getElementById('offer-pin-banner')) return; // already showing
    const el = document.createElement('div');
    el.id = 'offer-pin-banner';
    el.style.cssText = 'position:fixed;top:62px;left:8px;right:8px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 14px rgba(0,0,0,0.35);z-index:9999;font-size:.85rem;flex-wrap:wrap';
    el.innerHTML = \`
      <span style="flex:1;min-width:170px;line-height:1.35;color:var(--text)"><strong style="color:var(--accent)">Tip</strong> \u2014 Set a 4-digit PIN to lock Race Control to your device.</span>
      <button class="btn btn-secondary" style="padding:6px 12px;font-size:.78rem" onclick="document.getElementById('offer-pin-banner')?.remove()">Not now</button>
      <button class="btn btn-primary" style="padding:6px 12px;font-size:.78rem" onclick="document.getElementById('offer-pin-banner')?.remove();_pinModal('Choose a 4-digit PIN',async(pin)=>{if(pin===null||pin.length<1)return;carnivalMeta={...(carnivalMeta||{}),adminPin:String(pin)};await cRef('meta').update({adminPin:String(pin)});toast('PIN set \u2713');},true)">Set PIN</button>\`;
    document.body.appendChild(el);
    setTimeout(() => { document.getElementById('offer-pin-banner')?.remove(); }, 20000);
  }, 800);
}

function _pinModal(title, callback, isNew) {
  const el = document.createElement('div');
  el.id = 'pin-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = \`
    <div style="background:var(--surface);border-radius:16px;padding:20px;max-width:280px;width:100%;text-align:center">
      <div style="font-weight:700;font-size:1rem;margin-bottom:12px">\${title}</div>
      <div id="pin-display" style="font-size:2rem;letter-spacing:.4em;font-family:monospace;min-height:2.5rem;margin-bottom:12px">____</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">
        \${[1,2,3,4,5,6,7,8,9].map(n=>\`<button class="btn btn-secondary" style="font-size:1.2rem;padding:12px 0" onclick="_pinKey('\${n}')">\${n}</button>\`).join('')}
        <button class="btn btn-secondary" style="font-size:1rem;padding:12px 0" onclick="_pinKey('del')">\u232B</button>
        <button class="btn btn-secondary" style="font-size:1.2rem;padding:12px 0" onclick="_pinKey('0')">0</button>
        <button class="btn btn-secondary" style="font-size:1rem;padding:12px 0" onclick="_pinKey('ok')">OK</button>
      </div>
      <button class="btn btn-secondary" style="width:100%;margin-top:4px" onclick="_pinKey('cancel')">Cancel</button>
    </div>\`;
  document.body.appendChild(el);
  let pinVal = '';
  function refresh() {
    const disp = document.getElementById('pin-display');
    if (disp) disp.textContent = pinVal.split('').map(()=>'\u25CF').join(' ').padEnd(7,'_').replace(/ _ /g,' _ ') || '____';
  }
  window._pinKey = (k) => {
    if (k === 'cancel') { el.remove(); delete window._pinKey; callback(null); return; }
    if (k === 'del') { pinVal = pinVal.slice(0,-1); refresh(); return; }
    if (k === 'ok') {
      if (pinVal.length === 0) return;
      el.remove(); delete window._pinKey; callback(pinVal); return;
    }
    if (pinVal.length < 8) { pinVal += k; refresh(); }
    if (pinVal.length === 4 && !isNew) { el.remove(); delete window._pinKey; callback(pinVal); }
  };
}


// ─── STAFF PIN ────────────────────────────────────────────────────────────
// Lower-privilege gate than admin PIN. Timer/Marshal/Starter/Video Finish/Race Control
// roles require staff PIN. Observer + Results stay open.
function _renderStaffPin() {
  const card = document.getElementById('admin-staff-pin-card');
  const lbl = document.getElementById('admin-staff-pin-val');
  const qrEl = document.getElementById('admin-staff-pin-qr');
  if (!card || !lbl) return;
  let pin = carnivalMeta?.staffPin;
  if (!pin) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';
  lbl.textContent = String(pin);
  if (qrEl && typeof QRCode !== 'undefined' && carnivalCode) {
    qrEl.innerHTML = '';
    const url = location.origin + '/marketing#j=' + encodeURIComponent(carnivalCode) + '&p=' + encodeURIComponent(pin);
    try {
      new QRCode(qrEl, { text: url, width: 92, height: 92,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M });
    } catch(e){}
  }
}

function _expandStaffQr() {
  const pin = carnivalMeta?.staffPin;
  if (!pin || !carnivalCode) return;
  const url = location.origin + '/marketing#j=' + encodeURIComponent(carnivalCode) + '&p=' + encodeURIComponent(pin);
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:30px;cursor:pointer';
  wrap.onclick = () => wrap.remove();
  const inner = document.createElement('div');
  inner.style.cssText = 'background:#fff;padding:16px;border-radius:12px';
  wrap.appendChild(inner);
  const caption = document.createElement('div');
  caption.style.cssText = 'color:#fff;font-size:1.05rem;font-weight:600;text-align:center;line-height:1.4';
  caption.innerHTML = 'Carnival <code style="color:#14b8a6">' + carnivalCode + '</code> &middot; PIN <code style="color:#14b8a6">' + pin + '</code><br><span style="font-size:0.85rem;font-weight:400;color:#cbd5e1">Tap anywhere to close</span>';
  wrap.appendChild(caption);
  document.body.appendChild(wrap);
  try {
    new QRCode(inner, { text: url, width: 320, height: 320,
      colorDark: '#000000', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M });
  } catch(e){}
}

function _copyStaffPin() {
  const pin = carnivalMeta?.staffPin;
  if (!pin) return;
  try { navigator.clipboard.writeText(String(pin)); toast('Staff PIN copied'); } catch(e){}
}

async function _rotateStaffPin() {
  if (!confirm('Generate a new Staff PIN? Anyone using the old PIN will be locked out until you share the new one.')) return;
  const fresh = String(Math.floor(1000 + Math.random()*9000));
  try {
    await cRef('meta/staffPin').set(fresh);
    carnivalMeta = { ...(carnivalMeta||{}), staffPin: fresh };
    _renderStaffPin();
    toast('Staff PIN rotated ✓');
  } catch(e) { toast('Could not rotate PIN'); }
}

function _checkStaffPin(onSuccess) {
  // If staff PIN not set on this carnival, allow through (back-compat)
  const storedStaff = carnivalMeta?.staffPin;
  if (!storedStaff) {
    // Try auth as null; server may grant if no PIN set
    _send({type:'auth', pin: null, role:'staff'})
      .then(r => { if (r.type === 'auth_ok') onSuccess(); })
      .catch(() => onSuccess());
    return;
  }
  // QR deep-link: PIN already provided in URL, try silently first
  if (window._stagedStaffPin && String(window._stagedStaffPin) === String(storedStaff)) {
    _send({type:'auth', pin: String(window._stagedStaffPin), role:'staff'})
      .then(r => {
        if (r.type === 'auth_ok') {
          window._stagedStaffPin = null;
          onSuccess();
        } else {
          window._stagedStaffPin = null;
          _checkStaffPin(onSuccess);
        }
      })
      .catch(() => { window._stagedStaffPin = null; _checkStaffPin(onSuccess); });
    return;
  }
  // Same UI as admin PIN prompt
  _pinModal('Enter Carnival Staff PIN', async (entered) => {
    if (entered === null) return; // cancelled
    try {
      const r = await _send({type: 'auth', pin: String(entered), role: 'staff'});
      if (r.type === 'auth_ok') onSuccess();
      else if (r.message === 'too_many_attempts') toast('Too many failed attempts — reconnect and try again.');
      else toast('Incorrect Staff PIN');
    } catch {
      toast('Connection error — try again.');
    }
  });
}

function _enterTimerLanePicker() {
  document.getElementById('role-grid').style.display = 'none';
  const picker = document.getElementById('role-lane-picker');
  picker.classList.remove('hidden');
  picker.style.marginTop = '0';
  const btns = document.getElementById('lane-pick-btns');
  btns.innerHTML =
    \`<button class="btn btn-secondary" style="width:100%;margin-bottom:12px;font-size:0.9rem" onclick="showRolePicker()">\u2190 Back to roles</button>\` +
    Array.from({length:LANE_COUNT},(_,i)=>i+1)
      .map(n=>\`<button class="btn btn-primary" style="min-height:64px;font-size:1.2rem;font-weight:700;flex:1;min-width:80px" onclick="enterTimerLane(\${n})">Lane \${n}</button>\`)
      .join('');
  setTimeout(() => picker.scrollIntoView({behavior:'smooth', block:'start'}), 50);
}

function enterRole(role) {
  cleanListeners();
  if (role === 'timer') { _checkStaffPin(() => _enterTimerLanePicker()); return; }
  if (role === 'share')   { showSharePage(); return; }
  // Admin roles → admin PIN (full control of carnival meta + writes)
  if (role === 'admin')   { _checkAdminPin(() => { showScreen('admin'); initAdminView(); }); return; }
  if (role === 'admin-xc'){ _checkAdminPin(() => { showScreen('admin-xc'); initXCAdminView(); }); return; }
  // Protected write roles → staff PIN (lower privilege; can record but not change meta)
  if (role === 'starter') { _checkStaffPin(() => { showScreen('starter'); initStarterView(); }); return; }
  if (role === 'marshal') { _checkStaffPin(() => { showScreen('marshal'); initMarshalView(); }); return; }
  if (role === 'video-finish') { _checkStaffPin(() => { showScreen('video-finish'); initVideoFinish(); }); return; }
  // Open / read-only roles
  if (role === 'observer'){ showScreen('observer');    initObserverView();   return; }
  if (role === 'observer-xc'){ showScreen('observer-xc'); initXCObserverView(); return; }
  if (role === 'results')      { showScreen('results');      initResultsView();   return; }
  if (role === 'role')         { showRolePicker();            return; }
}

function switchRole() {
  // Cleanly leave the current role view and return to role picker, staying in the carnival.
  try { cleanListeners(); } catch(_) {}
  try { if (typeof xcStopCamera === 'function') xcStopCamera(); } catch(_) {}
  showRolePicker();
}

function enterTimerLane(n) {
  myLane = n;
  cleanListeners();
  showScreen('timer');
  initTimerView(n);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// TIMER VIEW (Lane Race)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function initTimerView(lane) {
  requestWakeLock();
  syncClock();
  watchConn('timer-dot');

  document.getElementById('timer-lane-label').textContent = \`Lane \${lane}\`;

  // Name gate
  const nameInput = document.getElementById('timer-name-input');
  const stopBtn   = document.getElementById('timer-stop-btn');
  if (myName) { nameInput.value = myName; stopBtn.removeAttribute('disabled'); document.getElementById('timer-name-gate').style.display='none'; }
  nameInput.addEventListener('input', ()=>{
    myName = nameInput.value.trim();
    localStorage.setItem('fl_name', myName);
    myName ? stopBtn.removeAttribute('disabled') : stopBtn.setAttribute('disabled','');
  });

  const raceRef = cRef('race/current');
  raceRef.on('value', snap => { raceState = snap.val(); renderTimerView(lane, raceState); });
  activeListeners.push(()=>raceRef.off());

  cRef('recall').on('value', snap => { if (snap.val()?.active) flashRecall(); });
  activeListeners.push(()=>cRef('recall').off());

  function tick() {
    if (raceState?.state==='live' && raceState.startedAtServer) {
      const el = document.getElementById('timer-clock');
      if (el) el.textContent = fmtMs(nowServer() - raceState.startedAtServer);
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

function renderTimerView(lane, race) {
  const waiting  = document.getElementById('timer-waiting-msg');
  const mySplit  = document.getElementById('timer-my-split');
  const splitsCard = document.getElementById('timer-splits-card');
  const stopBtn  = document.getElementById('timer-stop-btn');
  const badge    = document.getElementById('timer-badge-wrap');

  const recallBanner = document.getElementById('timer-recall-banner');

  if (!race || race.state==='idle') {
    waiting.classList.remove('hidden');
    mySplit.classList.add('hidden');
    splitsCard.classList.add('hidden');
    if (recallBanner) recallBanner.classList.add('hidden');
    document.getElementById('timer-clock').textContent = '0:00.00';
    badge.innerHTML = \`<span class="badge badge-idle">IDLE</span>\`;
    return;
  }
  waiting.classList.add('hidden');

  if (recallBanner) {
    race.recalled ? recallBanner.classList.remove('hidden') : recallBanner.classList.add('hidden');
  }

  const sportLabel = carnivalMeta?.sport==="swim" ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><path d="M2 20s2-2 5-2 5 2 7 2 5-2 7-2 3 1 3 1M2 16s2-2 5-2 5 2 7 2 5-2 7-2 3 1 3 1"/><circle cx="14" cy="5" r="2"/></svg>' : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
  document.getElementById('timer-athlete-event').innerHTML =
    \`\${sportLabel} \${race.age||''} \${race.gender||''} \xB7 \${race.event||''}\`;

  const laneData = race.lanes?.[lane];
  document.getElementById('timer-athlete-name').textContent = laneData?.name || \`Lane \${lane}\`;
  document.getElementById('timer-athlete-note').textContent = laneData?.note || '';

  if (race.state==='armed') {
    badge.innerHTML = \`<span class="badge badge-armed">ARMED</span>\`;
    document.getElementById('timer-clock').textContent = '0:00.00';
  } else if (race.state==='live') {
    badge.innerHTML = \`<span class="badge badge-live">LIVE</span>\`;
  } else if (race.state==='done') {
    badge.innerHTML = \`<span class="badge badge-done">DONE</span>\`;
  }

  // My split
  const myRec = race.splits?.[lane]?.[fbEnc(myId)];
  if (myRec) {
    document.getElementById('timer-my-time').textContent = fmtSec(myRec.elapsedMs);
    mySplit.classList.remove('hidden');
    stopBtn.textContent = 'Stopped';
    stopBtn.setAttribute('disabled','');
  } else {
    mySplit.classList.add('hidden');
    if (race.state==='live') { stopBtn.textContent = 'STOP'; stopBtn.removeAttribute('disabled'); }
    const expBtns = document.getElementById('admin-export-btns');
    if (expBtns) { if (race.state==='done') { expBtns.style.display='flex'; expBtns.classList.remove('hidden'); } else { expBtns.style.display='none'; } }
  }

  // All splits this lane
  const laneSplits = race.splits?.[lane] || {};
  const splitVals = Object.values(laneSplits);
  if (splitVals.length) {
    splitsCard.classList.remove('hidden');
    document.getElementById('timer-splits-list').innerHTML = splitVals.map(s=>\`
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--surface3)">
        <span class="text-muted text-sm">\${s.name||'?'}</span>
        <span class="font-mono" style="font-weight:700">\${fmtSec(s.elapsedMs)}</span>
      </div>\`).join('');
  } else { splitsCard.classList.add('hidden'); }
}

async function timerStop() {
  if (!raceState || raceState.state!=='live') { toast('Race not live'); return; }
  if (!myName) { toast('Enter your name first'); return; }
  const elapsed = nowServer() - raceState.startedAtServer;
  if (elapsed < 500) { toast('Too quick \u2014 check start'); return; }
  const key = fbEnc(myId);
  const splitPayload = { name: myName, elapsedMs: elapsed, stopAt: firebase.database.ServerValue.TIMESTAMP };
  _savePendingSplit(myLane, key, splitPayload);
  const splitBtn = document.getElementById('timer-stop-btn');
  if (splitBtn) { splitBtn.textContent = 'Sending\u2026'; splitBtn.setAttribute('disabled',''); }
  try {
    await cRef(\`race/current/splits/\${myLane}/\${key}\`).set(splitPayload);
    _clearPendingSplit(key);
    if (splitBtn) { splitBtn.textContent = 'Sent \u2713'; }
  } catch(err) {
    if (splitBtn) { splitBtn.textContent = '\u26A0 Queued'; }
    toast('WiFi issue \u2014 split saved, will retry');
  }
  vibrate([100]);
  flash('go', 300);
  toast(\`Stopped \u2014 \${fmtSec(elapsed)}\`);
  // 3-second undo window
  _showTimerUndo(myLane, key, elapsed);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// ADMIN VIEW (Lane Race)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

// \u2500\u2500 Roster pre-load modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openRosterModal() {
  const el = document.createElement('div');
  el.id = 'roster-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:16px;padding-top:60px;overflow-y:auto';
  const ph = '1, Jake Smith, Red\\n2, Sam Jones, Blue\\n3, Mia Brown, Green';
  el.innerHTML = '<div style="background:var(--surface);border-radius:16px;padding:20px;max-width:420px;width:100%">'
    + '<div style="font-weight:700;font-size:1rem;margin-bottom:4px">Paste Athlete Roster</div>'
    + '<div style="color:var(--muted);font-size:.8rem;margin-bottom:10px">One per line: <strong>Lane, Name, House</strong><br>'
    + 'E.g. <code style="color:var(--accent)">1, Jake Smith, Red</code></div>'
    + '<textarea id="roster-text" placeholder="' + ph + '" style="width:100%;min-height:160px;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:.85rem;font-family:monospace;resize:vertical"></textarea>'
    + '<div style="display:flex;gap:8px;margin-top:12px">'
    + '<button class="btn btn-primary" style="flex:1" onclick="applyRoster()">Apply to Lanes</button>'
    + '<button class="btn btn-secondary" onclick="document.getElementById(\\'roster-modal\\').remove()">Cancel</button>'
    + '</div></div>';
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
}

function applyRoster() {
  const text = document.getElementById('roster-text')?.value.trim();
  if (!text) return;
  const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
  let applied = 0;
  lines.forEach(line => {
    const parts = line.split(',').map(p => p.trim());
    const lane = parseInt(parts[0]);
    const name = parts[1] || '';
    const house = parts[2] || '';
    if (!lane || !name) return;
    const nameInp = document.querySelector('.admin-lane-name-input[data-lane="' + lane + '"]');
    if (nameInp) { nameInp.value = name; applied++; }
    if (house) {
      const houseInp = document.querySelector('.admin-lane-house[data-lane="' + lane + '"]');
      if (houseInp) {
        const opts = Array.from(houseInp.options);
        const match = opts.find(o => o.value.toLowerCase() === house.toLowerCase());
        if (match) houseInp.value = match.value;
      }
    }
  });
  document.getElementById('roster-modal')?.remove();
  toast('\u2705 ' + applied + ' athlete' + (applied !== 1 ? 's' : '') + ' loaded into lanes');
  const age = document.getElementById('admin-age-sel')?.value;
  const event = document.getElementById('admin-event-sel')?.value;
  if (age && event) {
    const savedLanes = {};
    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      const l = parseInt(parts[0]); const n = parts[1]||''; const h = parts[2]||'';
      if (l && n) savedLanes[l] = { name:n, ...(h?{house:h}:{}) };
    });
    _saveLaneNames(age, adminGender, event, savedLanes);
  }
}

function initAdminView() {
  requestWakeLock(); syncClock();
  watchConn('admin-dot');
  document.getElementById('admin-school-lbl').textContent = carnivalMeta?.school||'';

  // Show carnival code in header + Share button
  const codeEl = document.getElementById('admin-code-lbl');
  if (codeEl) {
    codeEl.textContent = carnivalCode;
    codeEl.onclick = () => { try { navigator.clipboard.writeText(carnivalCode); toast('Code copied!'); } catch(e){} };
  }

  // Staff PIN widget — render current value, watch for changes
  _renderStaffPin();
  const _staffPinRef = cRef('meta/staffPin');
  _staffPinRef.on('value', _snap => {
    const v = _snap.val();
    if (v) {
      carnivalMeta = { ...(carnivalMeta||{}), staffPin: String(v) };
      _renderStaffPin();
    }
  });
  activeListeners.push(()=>_staffPinRef.off());

  // Demo banner
  const banner = document.getElementById('admin-demo-banner');
  if (banner) banner.classList.add('hidden');
  if (carnivalMeta?.isDemo) initDemoBanner();

  // Populate dropdowns
  const ageSel = document.getElementById('admin-age-sel');
  ageSel.innerHTML = AGE_GROUPS.map(a=>\`<option>\${a}</option>\`).join('');
  const evSel = document.getElementById('admin-event-sel');
  const sport = carnivalMeta?.sport||'track';
  const evList = EVENTS[sport] || EVENTS.track;
  evSel.innerHTML = evList.map(e=>\`<option>\${e}</option>\`).join('');

  // Lane inputs
  const houses = carnivalMeta?.houses||[];
  const container = document.getElementById('admin-lane-inputs');
  container.innerHTML = Array.from({length:LANE_COUNT},(_,i)=>i+1).map(n=>\`
    <div class="admin-lane-row" id="alr-\${n}">
      <div class="admin-lane-num">\${n}</div>
      <input class="admin-lane-name-input" data-lane="\${n}"
        placeholder="Name or Bib #" type="text" style="flex:1">
      \${houses.length ? \`<select class="admin-lane-house" data-lane="\${n}"
          style="padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:.82rem;max-width:90px">
          <option value="">House</option>
          \${houses.map(h=>\`<option value="\${h}">\${h}</option>\`).join('')}
        </select>\` : ''}
      <div style="display:flex;gap:4px">
        <button type="button" class="status-btn" data-lane="\${n}" data-stype="dns" onclick="toggleLaneStatus(\${n},'dns')">DNS</button>
        <button type="button" class="status-btn" data-lane="\${n}" data-stype="dnf" onclick="toggleLaneStatus(\${n},'dnf')">DNF</button>
      </div>
    </div>\`).join('');
  dnsSet.clear(); dnfSet.clear();
  // House standings
  const houseCard = document.getElementById('admin-house-card');
  if (houses.length && houseCard) {
    houseCard.style.display = '';
    const hpRef = cRef('housePoints');
    hpRef.on('value', snap => {
      const pts = snap.val()||{};
      const sorted = [...houses].map(h=>({h, pts:pts[h]||0})).sort((a,b)=>b.pts-a.pts);
      const total = sorted.reduce((s,r)=>s+r.pts,0);
      document.getElementById('admin-house-standings').innerHTML = sorted.map((r,i)=>\`
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:.9rem;min-width:18px">\${i===0&&total>0?'\u{1F947}':i===1&&total>0?'\u{1F948}':i===2&&total>0?'\u{1F949}':''}</span>
          <span style="flex:1;font-weight:\${i===0&&total>0?'700':'400'}">\${r.h}</span>
          <span style="font-weight:700;font-size:1.05rem;color:\${i===0&&total>0?'var(--accent)':'var(--text)'}">\${r.pts}</span>
        </div>\`).join('');
    });
    activeListeners.push(()=>hpRef.off());
  } else if (houseCard) { houseCard.style.display = 'none'; }
  // Program "Next Event" button
  const prog = carnivalMeta?.program||[];
  const nextBtn = document.getElementById('admin-next-event-btn');
  if (prog.length && nextBtn) { nextBtn.style.display = ''; programIndex = 0; }
  else if (nextBtn) { nextBtn.style.display = 'none'; }

  const raceRef = cRef('race/current');
  raceRef.on('value', snap=>{raceState=snap.val(); renderAdminView(raceState);});
  activeListeners.push(()=>raceRef.off());

  function tick() {
    if (raceState?.state==='live' && raceState.startedAtServer) {
      const el=document.getElementById('admin-live-clock');
      if(el) el.textContent=fmtMs(nowServer()-raceState.startedAtServer);
    }
    rafId=requestAnimationFrame(tick);
  }
  rafId=requestAnimationFrame(tick);
}

function selectAdminGender(g) {
  adminGender = g;
  document.querySelectorAll('[data-ag]').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll(\`[data-ag="\${g}"]\`).forEach(p=>p.classList.add('active'));
}

function renderAdminView(race) {
  const setup = document.getElementById('admin-setup-panel');
  const live  = document.getElementById('admin-live-panel');
  const done  = document.getElementById('admin-done-panel');

  if (!race || race.state==='idle') {
    setup.classList.remove('hidden'); live.classList.add('hidden'); done.classList.add('hidden'); return;
  }
  setup.classList.add('hidden');

  if (race.state==='done') {
    live.classList.add('hidden'); done.classList.remove('hidden');
    renderAdminDone(race); return;
  }

  live.classList.remove('hidden'); done.classList.add('hidden');
  document.getElementById('admin-race-lbl').textContent = \`\${race.age||''} \${race.gender||''} \xB7 \${race.event||''}\`;

  const badge  = document.getElementById('admin-state-badge');
  const goBtn  = document.getElementById('admin-go-btn');
  const pubBtn = document.getElementById('admin-publish-btn');

  if (race.state==='armed') {
    badge.className='badge badge-armed'; badge.textContent='ARMED';
    goBtn.removeAttribute('disabled'); pubBtn.classList.add('hidden');
    document.getElementById('admin-live-clock').textContent='0:00.00';
  } else if (race.state==='live') {
    badge.className='badge badge-live'; badge.textContent='LIVE';
    goBtn.setAttribute('disabled','');
  }

  // Splits
  const lanes = race.lanes||{};
  const splits = race.splits||{};
  let allTimed = Object.keys(lanes).length>0;

  document.getElementById('admin-splits-list').innerHTML = Array.from({length:LANE_COUNT},(_,i)=>i+1).map(n=>{
    if (!lanes[n]) return '';
    const laneSplits = splits[n]||{};
    const vals = Object.values(laneSplits).map(s=>s.elapsedMs).filter(Boolean);
    const mean = vals.length ? trimmedMean(vals) : null;
    const conf = confidenceFor(laneSplits);
    if (!mean) allTimed = false;
    return \`<div class="lane-row">
      <div class="lane-num">\${n}</div>
      <div class="lane-name">\${lanes[n]?.name||\`Lane \${n}\`}</div>
      \${mean ? \`<div><span class="lane-time">\${fmtSec(mean)}</span> <span class="conf-\${conf.cls}">\${conf.label}</span></div>\`
             : \`<span class="text-muted text-xs">\${race.state==='live'?'waiting\u2026':'\u2014'}</span>\`}
    </div>\`;
  }).join('');

  if (race.state==='live' && allTimed) pubBtn.classList.remove('hidden');
}

function toggleLaneStatus(lane, type) {
  const l = String(lane);
  const setA = type==='dns' ? dnsSet : dnfSet;
  const setB = type==='dns' ? dnfSet : dnsSet;
  if (setA.has(l)) { setA.delete(l); } else { setA.add(l); setB.delete(l); }
  // Update button styles
  document.querySelectorAll(\`.status-btn[data-lane="\${lane}"]\`).forEach(btn => {
    const t = btn.dataset.stype;
    btn.classList.remove('active-dns','active-dnf');
    if (t==='dns' && dnsSet.has(l)) btn.classList.add('active-dns');
    if (t==='dnf' && dnfSet.has(l)) btn.classList.add('active-dnf');
  });
}
function adminNextEvent() {
  const prog = carnivalMeta?.program||[];
  if (!prog.length) return;
  if (programIndex >= prog.length) { toast('\u{1F3C1} Program complete!'); return; }
  const ev = prog[programIndex];
  // Set age
  const ageSel = document.getElementById('admin-age-sel');
  if (ageSel) ageSel.value = ev.age;
  selectAdminGender(ev.gender||'boys');
  // Set event
  const evSel = document.getElementById('admin-event-sel');
  if (evSel) evSel.value = ev.event;
  // Load saved lane names
  _loadLaneNames(ev.age, ev.gender||'boys', ev.event);
  const num = programIndex + 1;
  programIndex++;
  const remaining = prog.length - programIndex;
  const nextBtn = document.getElementById('admin-next-event-btn');
  if (nextBtn) nextBtn.textContent = remaining > 0 ? \`Next Event (\${remaining} left) \u2192\` : 'Program Done';
  toast(\`Event \${num}/\${prog.length}: \${ev.age} \${ev.gender} \u2014 \${ev.event}\`);
}

function _confirmModal(title, body, confirmLabel = 'Confirm') {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    el.innerHTML = \`
      <div style="background:var(--surface,#1e1e2e);border-radius:16px;padding:24px;max-width:320px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.4)">
        <div style="font-weight:700;font-size:1rem;margin-bottom:8px;color:var(--text,#fff)">\${title}</div>
        <div style="color:var(--muted,#aaa);font-size:.85rem;margin-bottom:20px">\${body}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" style="flex:1" id="_cm-cancel">Cancel</button>
          <button class="btn btn-primary" style="flex:1" id="_cm-confirm">\${confirmLabel}</button>
        </div>
      </div>\`;
    document.body.appendChild(el);
    el.querySelector('#_cm-cancel').onclick  = () => { el.remove(); resolve(false); };
    el.querySelector('#_cm-confirm').onclick = () => { el.remove(); resolve(true); };
    el.addEventListener('click', e => { if (e.target === el) { el.remove(); resolve(false); } });
  });
}

async function adminResetHousePoints() {
  if (!await _confirmModal('Reset house points?', 'This will clear all accumulated house points for this carnival.', 'Reset')) return;
  await cRef('housePoints').remove();
  toast('House points reset');
}
async function adminArm() {
  if (!await _confirmModal('Arm this race?', 'All connected timers and the Starter will be notified.', 'ARM RACE \u2192')) return;
  const age   = document.getElementById('admin-age-sel').value;
  const event = document.getElementById('admin-event-sel').value;
  const lanes = {};
  document.querySelectorAll('.admin-lane-name-input').forEach(inp=>{
    const n = inp.dataset.lane;
    const v = inp.value.trim();
    if (!v) return;
    const house = document.querySelector(\`.admin-lane-house[data-lane="\${n}"]\`)?.value||'';
    const status = dnsSet.has(n) ? 'dns' : dnfSet.has(n) ? 'dnf' : '';
    lanes[n] = { name:v, ...(house?{house}:{}), ...(status?{status}:{}) };
  });
  dnsSet.clear(); dnfSet.clear();
  // Persist lane names for this age/gender/event
  _saveLaneNames(age, adminGender, event, lanes);
  await cRef('race/current').set({
    raceId: genId(6), age, gender:adminGender, event,
    state:'armed', lanes, splits:{},
    armedAt: firebase.database.ServerValue.TIMESTAMP
  });
  toast('Race armed');
}

async function adminGo() {
  if (!raceState || raceState.state!=='armed') return;
  document.getElementById('admin-go-btn').setAttribute('disabled','');
  showCountdown(async ()=>{
    await cRef('race/current').update({ state:'live', startedAtServer:firebase.database.ServerValue.TIMESTAMP });
  });
}

async function adminRecall() {
  await cRef('race/current').update({ state:'armed', startedAtServer:null });
  broadcastRecall();
}

function broadcastRecall() {
  cRef('recall').set({ active:true, at:firebase.database.ServerValue.TIMESTAMP });
  setTimeout(()=>cRef('recall').set({active:false}), 2500);
  flashRecall();
}

async function adminClear() {
  modal('Clear Splits','Remove all timer splits for this race?',[
    { label:'Clear', cls:'btn-danger', fn: async ()=>{
      await cRef('race/current/splits').set({});
      toast('Splits cleared');
    }},
    { label:'Cancel' }
  ]);
}

async function adminAbandon() {
  modal('Abandon Race','Return to setup and discard this race?',[
    { label:'Abandon', cls:'btn-danger', fn: async ()=>{
      await cRef('race/current').set({state:'idle'});
    }},
    { label:'Cancel' }
  ]);
}

async function adminPublish() {
  if (!raceState) return;
  // Heat picker
  _promptHeat(async (heatSuffix) => {
    const lanes  = raceState.lanes||{};
    const splits = raceState.splits||{};
    const results = [];
    let place = 1;
    // Build sorted non-DQ first to assign places
    const allRows = [];
    Object.keys(lanes).forEach(lane=>{
      const laneData = lanes[lane];
      const status = laneData?.status;
      const house  = laneData?.house||'';
      if (status === 'dns' || status === 'dnf') {
        allRows.push({ lane:parseInt(lane), name:laneData?.name||\`Lane \${lane}\`,
          timeMs:null, dq:false, status, house });
        return;
      }
      const vals = Object.values(splits[lane]||{}).map(s=>s.elapsedMs).filter(Boolean);
      const mean = vals.length ? trimmedMean(vals) : null;
      if (mean!=null) allRows.push({ lane:parseInt(lane), name:laneData?.name||\`Lane \${lane}\`,
        timeMs:mean, dq: dqSet.has(String(lane)), house, status:'' });
    });
    allRows.sort((a,b)=> {
      const ord = r => r.status==='dns' ? 4 : r.status==='dnf' ? 3 : r.dq ? 2 : 0;
      if (ord(a) !== ord(b)) return ord(a) - ord(b);
      return (a.timeMs||0) - (b.timeMs||0);
    });
    const PTS = [8,6,5,4,3,2,1];
    const houseDeltas = {};
    allRows.forEach(r => {
      if (!r.dq && !r.status) {
        r.place = place++;
        if (r.house) houseDeltas[r.house] = (houseDeltas[r.house]||0) + (PTS[r.place-1]||0);
      }
    });
    const eventName = raceState.event + heatSuffix;
    const key = fbEnc(\`\${raceState.age}-\${raceState.gender}-\${eventName}-\${raceState.raceId}\`);
    await cRef(\`results/\${key}\`).set({
      type:'lane', age:raceState.age, gender:raceState.gender, event:eventName,
      raceId:raceState.raceId, results:allRows,
      publishedAt:firebase.database.ServerValue.TIMESTAMP
    });
    // Accumulate house points
    if (Object.keys(houseDeltas).length) {
      const hpRef = cRef('housePoints');
      const snap = await hpRef.once('value');
      const existing = snap.val()||{};
      const merged = {...existing};
      Object.entries(houseDeltas).forEach(([h,pts]) => { merged[h] = (merged[h]||0) + pts; });
      await hpRef.set(merged);
    }
    await cRef('race/current').update({state:'done'});
    dqSet.clear();
    // Falkor auto-AI: race summary + flag times (fire-and-forget)
    (async()=>{
      try{
        const _r=allRows.filter(r=>r.timeMs&&!r.dq&&!r.status).map(r=>({lane:r.lane,athlete:r.name,school:r.house||'',time:+(r.timeMs/1000).toFixed(2)}));
        if(_r.length>=2){
          const _s=await fetch('https://falkor-ct-ai.luckdragon.io/summarize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:eventName,results:_r})});
          if(_s.ok){const{summary}=await _s.json();if(summary)await cRef('results/'+key+'/ai_summary').set({text:summary,ts:Date.now()});}
          const _f=await fetch('https://falkor-ct-ai.luckdragon.io/flag-times',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:eventName,results:Object.keys(lanes).map(l=>({lane:+l,athlete:lanes[l]?.name||'Lane '+l,school:lanes[l]?.house||'',splits:Object.values(splits[l]||{}).map(s=>+(s.elapsedMs/1000).toFixed(2)),published:allRows.find(r=>r.lane===+l)?.timeMs?+(allRows.find(r=>r.lane===+l).timeMs/1000).toFixed(2):null}))})});
          if(_f.ok){const{flags}=await _f.json();if(flags&&flags.length)await cRef('results/'+key+'/ai_flags').set({flags,ts:Date.now()});}
        }
      }catch(_e){console.warn('Falkor AI:',_e);}
    })();
    toast('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> Results published!');
  });
}

function _promptHeat(callback) {
  const el = document.createElement('div');
  el.id = 'heat-modal';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = \`
    <div style="background:var(--surface);border-radius:16px;padding:20px;max-width:300px;width:100%;text-align:center">
      <div style="font-weight:700;font-size:1rem;margin-bottom:4px">Heat / Round</div>
      <div style="color:var(--muted);font-size:.82rem;margin-bottom:14px">Label this result (optional)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <button class="btn btn-secondary" onclick="_heatPick(' \u2014 Heat 1')">Heat 1</button>
        <button class="btn btn-secondary" onclick="_heatPick(' \u2014 Heat 2')">Heat 2</button>
        <button class="btn btn-secondary" onclick="_heatPick(' \u2014 Heat 3')">Heat 3</button>
        <button class="btn btn-secondary" onclick="_heatPick(' \u2014 Final')">Final</button>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="_heatPick('')">No label \u2014 publish as-is</button>
    </div>\`;
  document.body.appendChild(el);
  window._heatPick = (suffix) => { el.remove(); delete window._heatPick; callback(suffix); };
}

async function adminEditTime(idx) {
  // Load current published results for this race and let admin correct a single time.
  const raceId = raceState && raceState.raceId;
  if (!raceId) { toast('No race loaded'); return; }
  const key = fbEnc(\`\${raceState.age}-\${raceState.gender}-\${raceState.event}-\${raceState.raceId}\`);
  const snap = await cRef(\`results/\${key}\`).once('value');
  const pub = snap.val();
  if (!pub || !Array.isArray(pub.results) || !pub.results[idx]) { toast('Cannot edit: result not found'); return; }
  const row = pub.results[idx];
  const currentSec = (row.timeMs/1000).toFixed(2);
  const newStr = prompt(\`Edit time for \${row.name||'Lane '+row.lane} (seconds, e.g. 14.82):\`, currentSec);
  if (newStr===null) return;
  const newSec = parseFloat(newStr);
  if (!isFinite(newSec) || newSec<=0) { toast('Invalid time'); return; }
  pub.results[idx].timeMs = Math.round(newSec*1000);
  pub.results[idx].edited = true;
  pub.results[idx].editedAt = Date.now();
  // Re-sort + re-place
  pub.results.sort((a,b)=>a.timeMs-b.timeMs);
  pub.results.forEach((r,i)=>r.place=i+1);
  pub.editedAt = firebase.database.ServerValue.TIMESTAMP;
  await cRef(\`results/\${key}\`).set(pub);
  toast('Time updated');
}

function adminNewRace() {
  dqSet.clear();
  cRef('race/current').set({state:'idle'});
  document.querySelectorAll('.admin-lane-name-input').forEach(inp=>inp.value='');
  // Try to reload saved names for current selection
  const age   = document.getElementById('admin-age-sel')?.value;
  const event = document.getElementById('admin-event-sel')?.value;
  if (age && event) _loadLaneNames(age, adminGender, event);
}

async function adminPublishFromDone() {
  if (!raceState || raceState.state !== 'done') return;
  const btn = document.getElementById('admin-done-publish-btn');
  if (btn) { btn.setAttribute('disabled',''); btn.textContent = 'Publishing\u2026'; }
  await adminPublish();
  if (btn) { btn.removeAttribute('disabled'); btn.textContent = 'Publish Results'; }
}

function renderAdminDone(race) {
  const splits = race.splits||{};
  const lanes  = race.lanes||{};
  const results = [];
  Object.keys(lanes).forEach(lane=>{
    const laneData = lanes[lane];
    const status = laneData?.status;
    if (status === 'dns' || status === 'dnf') {
      results.push({ lane, name:laneData?.name, timeMs:null, status });
      return;
    }
    const vals = Object.values(splits[lane]||{}).map(s=>s.elapsedMs).filter(Boolean);
    const mean = vals.length ? trimmedMean(vals) : null;
    if (mean) results.push({ lane, name:laneData?.name, timeMs:mean, status:'' });
  });
  results.sort((a,b)=>{
    const ord = r => r.status==='dns' ? 4 : r.status==='dnf' ? 3 : 0;
    if (ord(a)!==ord(b)) return ord(a)-ord(b);
    return (a.timeMs||0)-(b.timeMs||0);
  });
  // Re-number non-DQ places
  let place = 1;
  const placed = results.map(r => {
    const isDQ = dqSet.has(String(r.lane));
    const isSpec = isDQ || r.status==='dns' || r.status==='dnf';
    return { ...r, isDQ, place: isSpec ? null : place++ };
  });
  document.getElementById('admin-results-list').innerHTML = placed.map((r,i)=>\`
    <div class="lane-row" style="opacity:\${r.isDQ?0.45:1};transition:opacity .15s">
      <div class="medal \${r.isDQ?'pN':r.status==='dns'?'pN':r.status==='dnf'?'pN':medalCls(r.place)}" style="\${r.isDQ?'background:var(--warn);color:#fff':r.status?'background:var(--muted);color:#fff':''}">\${r.isDQ?'DQ':r.status?r.status.toUpperCase():(r.place)}</div>
      <div class="lane-name" onclick="\${!r.status?\`adminEditTime(\${i})\`:''}" style="flex:1;\${!r.status?'cursor:pointer':''}" \${!r.status?'title="Tap to edit time"':''}>\${r.name||\`Lane \${r.lane}\`}\${r.isDQ?'<span style="font-size:.7rem;color:var(--warn);margin-left:6px">DQ</span>':r.status?\`<span style="font-size:.7rem;color:var(--muted);margin-left:6px">\${r.status.toUpperCase()}</span>\`:''}</div>
      <div class="lane-time font-mono" onclick="adminEditTime(\${i})" style="cursor:pointer">\${r.isDQ?'\u2014':fmtSec(r.timeMs)}</div>
      <button class="btn btn-sm" style="margin-left:6px;padding:2px 8px;font-size:.7rem;border:1px solid \${r.isDQ?'var(--warn)':'var(--border)'};color:\${r.isDQ?'var(--warn)':'var(--muted)'};background:transparent;border-radius:6px" onclick="adminToggleDQ('\${r.lane}')">\${r.isDQ?'\u2715 DQ':'DQ'}</button>
    </div>\`).join('') || '<div class="text-muted text-sm">No timed athletes</div>';
}

function adminToggleDQ(lane) {
  const k = String(lane);
  if (dqSet.has(k)) dqSet.delete(k); else dqSet.add(k);
  if (raceState) renderAdminDone(raceState);
}

function medalCls(p) { return p===1?'p1':p===2?'p2':p===3?'p3':'pN'; }

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// STARTER VIEW
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// \u2500\u2500 Starter audio state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let starterAudioCtx    = null;
let starterAnalyser    = null;
let starterMicStream   = null;
let starterListening   = false;
let starterNoiseFloor  = 0;
let starterNoiseCount  = 0;
let starterSensitivity = 'med';
let starterListenRafId = null;
const STARTER_SENS_MULT = { high:3, med:5, low:9 };

function initStarterView() {
  watchConn('starter-dot');
  const raceRef = cRef('race/current');
  raceRef.on('value', snap=>{
    const race = snap.val();
    const w = document.getElementById('starter-waiting');
    const a = document.getElementById('starter-armed');
    if (!race || race.state==='idle') {
      w.classList.remove('hidden'); a.classList.add('hidden');
      starterListenStop(); return;
    }
    if (race.state==='armed') {
      w.classList.add('hidden'); a.classList.remove('hidden');
      document.getElementById('starter-race-info').textContent =
        \`\${race.age||''} \${race.gender||''} \xB7 \${race.event||''}\`;
    } else {
      w.classList.remove('hidden'); a.classList.add('hidden');
      starterListenStop();
    }
  });
  activeListeners.push(()=>raceRef.off());
}

// \u2500\u2500 Manual GO (with countdown) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function starterGo() {
  document.getElementById('starter-go-btn').setAttribute('disabled','');
  showCountdown(async ()=>{
    await cRef('race/current').update({ state:'live', startedAtServer:firebase.database.ServerValue.TIMESTAMP });
  });
}
function starterRecall() { starterListenStop(); broadcastRecall(); }

// \u2500\u2500 Gun detection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function starterSetSens(s) {
  starterSensitivity = s;
  document.querySelectorAll('[data-sens]').forEach(b => {
    const active = b.dataset.sens === s;
    b.className = active ? 'btn btn-primary' : 'btn btn-secondary';
    b.style.fontSize = '0.75rem'; b.style.padding = '4px 10px';
  });
}

async function starterListenStart() {
  try {
    starterMicStream = await navigator.mediaDevices.getUserMedia({audio:true, video:false});
    starterAudioCtx  = new (window.AudioContext||window.webkitAudioContext)();
    const source = starterAudioCtx.createMediaStreamSource(starterMicStream);
    starterAnalyser  = starterAudioCtx.createAnalyser();
    starterAnalyser.fftSize = 256;
    source.connect(starterAnalyser);
    starterListening  = true;
    starterNoiseFloor = 0;
    starterNoiseCount = 0;
    document.getElementById('starter-listen-idle').classList.add('hidden');
    document.getElementById('starter-listen-active').classList.remove('hidden');
    document.getElementById('starter-cal-lbl').textContent = 'Calibrating\u2026';
    starterListenRafId = requestAnimationFrame(starterListenLoop);
  } catch(e) {
    toast('Microphone access denied');
  }
}

function starterListenStop() {
  starterListening = false;
  if (starterListenRafId) { cancelAnimationFrame(starterListenRafId); starterListenRafId=null; }
  if (starterMicStream)   { starterMicStream.getTracks().forEach(t=>t.stop()); starterMicStream=null; }
  if (starterAudioCtx)    { starterAudioCtx.close().catch(()=>{}); starterAudioCtx=null; }
  const idle   = document.getElementById('starter-listen-idle');
  const active = document.getElementById('starter-listen-active');
  const bar    = document.getElementById('starter-vol-bar');
  if (idle)   idle.classList.remove('hidden');
  if (active) active.classList.add('hidden');
  if (bar)    bar.style.width = '0%';
}

function starterListenLoop() {
  starterListenRafId = null;
  if (!starterListening || !starterAnalyser) return;

  const data = new Uint8Array(starterAnalyser.frequencyBinCount);
  starterAnalyser.getByteTimeDomainData(data);

  // RMS
  let sum = 0;
  for (let i=0; i<data.length; i++) { const v=(data[i]-128)/128; sum+=v*v; }
  const rms = Math.sqrt(sum / data.length);

  // Volume bar (0-100%)
  const bar = document.getElementById('starter-vol-bar');
  if (bar) bar.style.width = Math.min(100, Math.round(rms*500)) + '%';

  if (starterNoiseCount < 40) {
    // First ~0.7s: calibrate noise floor
    starterNoiseFloor = (starterNoiseFloor * starterNoiseCount + rms) / (starterNoiseCount + 1);
    starterNoiseCount++;
    if (starterNoiseCount >= 40) {
      const calLbl = document.getElementById('starter-cal-lbl');
      const nfPct  = Math.round(Math.min(100, starterNoiseFloor * 2000));
      if (calLbl) calLbl.textContent = \`Ready (noise: \${nfPct}%)\`;
    }
  } else {
    const mult      = STARTER_SENS_MULT[starterSensitivity] || 5;
    const threshold = Math.max(0.06, starterNoiseFloor * mult);
    if (rms > threshold) {
      // GUN DETECTED \u2014 show 1-second cancellable countdown
      starterListenStop();
      starterGunCountdown();
      return;
    }
  }

  starterListenRafId = requestAnimationFrame(starterListenLoop);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// OBSERVER VIEW (Lane Race)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function renderObserverResults(data) {
  const board = document.getElementById('observer-results-board');
  const list  = document.getElementById('observer-results-list');
  if (!board || !list) return;
  if (!data || !Object.keys(data).length) { board.style.display='none'; return; }
  board.style.display = 'block';

  const events = Object.values(data).sort((a,b) => (b.publishedAt||0) - (a.publishedAt||0));
  list.innerHTML = events.map(ev => {
    const isXC = ev.type === 'xc';
    const places = isXC ? (ev.places||[]) : (ev.results||[]);
    const rows = places.slice(0,6).map((r,i) => {
      const isDQ = !isXC && r.dq;
      const pos  = isXC ? r.place : (isDQ ? null : (i+1));
      const name = r.name || (isXC ? '' : \`Lane \${r.lane}\`);
      const time = fmtSec(isXC ? r.elapsedMs : r.timeMs);
      return \`<div class="lane-row" style="padding:6px 4px;\${isDQ?'opacity:.45':''}" >
        <div class="medal \${isDQ?'pN':medalCls(pos)}" style="font-size:.8rem;\${isDQ?'background:var(--warn);color:#fff':''}">\${isDQ?'DQ':(pos)}</div>
        <div class="lane-name" style="font-size:.9rem">\${name}</div>
        <div class="lane-time font-mono" style="font-size:.9rem">\${isDQ?'\u2014':time}</div>
      </div>\`;
    }).join('');
    return \`<div class="card" style="margin-bottom:8px;padding:10px 12px">
      <div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:6px">\${ev.age||''} \${ev.gender||''} \xB7 \${ev.event||''}</div>
      \${rows}
      \${ev.ai_summary?'<div style="margin-top:8px;padding:8px 10px;background:rgba(99,102,241,.1);border-radius:8px;font-size:.82rem;font-style:italic;color:var(--text)">\u{1F916} '+ev.ai_summary.text+'</div>':''}
      \${ev.ai_flags&&ev.ai_flags.flags&&ev.ai_flags.flags.some(f=>f.severity==='error'||f.severity==='warn')?'<div style="margin-top:4px;padding:6px 10px;background:rgba(245,158,11,.15);border-radius:8px;font-size:.78rem;color:var(--warn)">\u26A0\uFE0F '+ev.ai_flags.flags.filter(f=>f.severity!=='info').map(f=>'Lane '+f.lane+': '+f.issue).join(' \xB7 ')+'</div>':''}
    </div>\`;
  }).join('');
}

function initObserverView() {
  watchConn('observer-dot');
  const raceRef = cRef('race/current');
  raceRef.on('value', snap=>{ raceState=snap.val(); renderObserverView(raceState); });
  activeListeners.push(()=>raceRef.off());

  // Published results board
  const resRef = cRef('results');
  resRef.on('value', snap => { renderObserverResults(snap.val()); });
  activeListeners.push(()=>resRef.off());

  function tick() {
    if (raceState?.state==='live' && raceState.startedAtServer) {
      const el=document.getElementById('observer-clock');
      if(el) el.textContent=fmtMs(nowServer()-raceState.startedAtServer);
    }
    rafId=requestAnimationFrame(tick);
  }
  rafId=requestAnimationFrame(tick);
}

function renderObserverView(race) {
  const waiting = document.getElementById('observer-waiting');
  const list    = document.getElementById('observer-lanes-list');
  if (!race || race.state==='idle') {
    waiting.classList.remove('hidden'); list.innerHTML='';
    document.getElementById('observer-event-lbl').textContent=''; return;
  }
  waiting.classList.add('hidden');
  document.getElementById('observer-event-lbl').textContent=
    \`\${race.age||''} \${race.gender||''} \xB7 \${race.event||''}\`;

  const lanes  = race.lanes||{};
  const splits = race.splits||{};
  const data = Object.keys(lanes).map(n=>{
    const vals = Object.values(splits[n]||{}).map(s=>s.elapsedMs).filter(Boolean);
    const mean = vals.length ? trimmedMean(vals) : null;
    const conf = confidenceFor(splits[n]||{});
    return { n:parseInt(n), name:lanes[n]?.name||\`Lane \${n}\`, mean, conf };
  });
  const ranked = [...data].filter(d=>d.mean!=null).sort((a,b)=>a.mean-b.mean);
  const rankMap={};
  ranked.forEach((d,i)=>rankMap[d.n]=i+1);

  list.innerHTML = data.sort((a,b)=>a.n-b.n).map(d=>{
    const place = rankMap[d.n];
    const numStyle = place===1?'background:#FFD700;color:#000':place===2?'background:#C0C0C0;color:#000':place===3?'background:#CD7F32;color:#fff':'';
    return \`<div class="lane-row">
      <div class="lane-num" style="\${numStyle}">\${place||d.n}</div>
      <div class="lane-name">\${d.name}</div>
      \${d.mean
        ? \`<div><span class="lane-time font-mono">\${fmtSec(d.mean)}</span> <span class="conf-\${d.conf.cls}">\${d.conf.label}</span></div>\`
        : \`<span class="text-muted text-xs">\${race.state==='live'?'\u2026':'\u2014'}</span>\`}
    </div>\`;
  }).join('');
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// COUNTDOWN
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function showCountdown(onGo) {
  if (countdownRunning) return;
  countdownRunning = true;
  const overlay = document.getElementById('countdown-overlay');
  const numEl   = document.getElementById('countdown-num');
  const lblEl   = document.getElementById('countdown-label');
  overlay.classList.add('active');

  [
    { n:'3', l:'Get set\u2026',      d:0 },
    { n:'2', l:'Ready\u2026',        d:1000 },
    { n:'1', l:'On your marks\u2026',d:2000 },
    { n:'GO',l:'',              d:3000, go:true }
  ].forEach(({n,l,d,go})=>{
    setTimeout(()=>{
      numEl.textContent = n;
      numEl.style.color = go ? 'var(--success)' : 'var(--text)';
      lblEl.textContent = l;
      vibrate(go ? [200,60,200] : [40]);
      if (go) { flash('go',600); onGo && onGo(); }
    }, d);
  });

  setTimeout(()=>{ overlay.classList.remove('active'); countdownRunning=false; }, 3900);
}

function flashRecall() {
  const overlay = document.getElementById('countdown-overlay');
  const numEl   = document.getElementById('countdown-num');
  const lblEl   = document.getElementById('countdown-label');
  overlay.classList.add('active');
  numEl.innerHTML = '<span style="display:inline-block;width:0.8em;height:0.8em;background:var(--danger);border-radius:50%;vertical-align:middle"></span>';
  numEl.style.color  = 'var(--danger)';
  lblEl.textContent  = 'FALSE START \u2014 RECALL';
  vibrate([200,80,200,80,200]);
  flash('recall', 1800);
  setTimeout(()=>overlay.classList.remove('active'), 2000);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// CROSS COUNTRY \u2014 MARSHAL VIEW
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
let bibPendingKey   = null;
let bibPendingQueue = [];    // [{key, place, elapsed}]
let bibValue        = '';
let xcCamStream     = null;  // active getUserMedia stream
const xcPhotos      = new Map(); // key \u2192 dataURL of best burst frame
let _ocrWorker      = null;  // reusable Tesseract worker

async function xcInitCamera() {
  if (xcCamStream) return;
  try {
    xcCamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    const v = document.getElementById('xc-cam');
    v.srcObject = xcCamStream;
    await v.play().catch(()=>{});
  } catch(e) {
    xcCamStream = null; // camera unavailable (deny or no camera) \u2014 silently degrade
  }
}

async function xcCapturePhoto(key) {
  // Start camera if not running
  if (!xcCamStream) xcInitCamera(); // fire and forget \u2014 first tap may miss
  xcPhotos.set(key, null); // placeholder

  const video  = document.getElementById('xc-cam');
  const canvas = document.getElementById('xc-cap');
  const ctx    = canvas.getContext('2d');

  // Give video a moment, then burst 3 frames
  await new Promise(r => setTimeout(r, 80));
  const frames = [];
  for (let i = 0; i < 3; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 180));
    if (video.readyState >= 2 && xcCamStream) {
      canvas.width = 400; canvas.height = 300;
      ctx.drawImage(video, 0, 0, 400, 300);
      frames.push(canvas.toDataURL('image/jpeg', 0.55));
    }
  }
  // Use last frame (runner most likely cleared the line)
  if (frames.length) xcPhotos.set(key, frames[frames.length-1]);
}

async function runBibOCR() {
  const photoDataUrl = xcPhotos.get(bibPendingKey);
  if (!photoDataUrl) { toast('No photo captured'); return; }
  const btn = document.getElementById('ocr-btn');
  if (btn) btn.textContent = '\u23F3';
  try {
    if (!_ocrWorker) {
      _ocrWorker = await Tesseract.createWorker('eng');
      await _ocrWorker.setParameters({ tessedit_char_whitelist: '0123456789' });
    }
    const { data: { text, confidence } } = await _ocrWorker.recognize(photoDataUrl);
    const digits = text.replace(/\\D/g,'').slice(0,4);
    if (digits && confidence > 55) {
      bibValue = digits;
      document.getElementById('marshal-bib-display').textContent = bibValue;
      if (btn) btn.textContent = '\u2713 ' + digits;
      toast('Bib ' + digits + ' detected (' + Math.round(confidence) + '% conf)');
    } else {
      if (btn) btn.textContent = '\u{1F50D} Auto';
      toast('Could not read bib \u2014 enter manually');
    }
  } catch(e) {
    if (btn) btn.textContent = '\u{1F50D} Auto';
    toast('OCR error');
  }
}

function initMarshalView() {
  requestWakeLock(); syncClock();
  watchConn('marshal-dot');
  xcInitCamera(); // warm up camera in background

  const xcRef = cRef('xc/current');
  xcRef.on('value', snap => { xcState=snap.val(); renderMarshalView(xcState); });
  activeListeners.push(() => xcRef.off());

  cRef('recall').on('value', snap => { if(snap.val()?.active) flashRecall(); });
  activeListeners.push(() => cRef('recall').off());

  function tick() {
    if (xcState?.state==='live' && xcState.startedAtServer) {
      const t = fmtMs(nowServer()-xcState.startedAtServer);
      const el = document.getElementById('marshal-clock-mini');
      if (el) el.textContent = t;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

function renderMarshalView(xc) {
  const waiting = document.getElementById('marshal-waiting');
  const live    = document.getElementById('marshal-live');
  if (!xc || xc.state!=='live') {
    live.classList.add('hidden'); waiting.classList.remove('hidden');
    const msg = document.getElementById('marshal-wait-msg');
    if (xc?.state==='armed') {
      msg.innerHTML = \`Race armed \u2014 waiting for GO<br>
        <span style="color:var(--accent);font-weight:700;font-size:1.1rem">\${xc.age||''} \${xc.gender||''} \xB7 \${xc.event||''}</span>\`;
    } else { msg.textContent='Waiting for race to start...'; }
    return;
  }
  live.classList.remove('hidden'); waiting.classList.add('hidden');
  document.getElementById('marshal-event-lbl').textContent = \`\${xc.age||''} \${xc.gender||''} \xB7 \${xc.event||''}\`;
  renderMarshalFinishes(xc);
}

function renderMarshalFinishes(xc) {
  const list = document.getElementById('marshal-finishes-list');
  const finishes = xc?.finishes || {};
  const entries = Object.entries(finishes)
    .sort((a,b)=>(a[1].tapAt||0)-(b[1].tapAt||0));

  if (!entries.length) {
    list.innerHTML = '<div class="text-muted text-sm text-center" style="padding:12px 0">No finishes yet \u2014 tap above</div>';
    return;
  }

  list.innerHTML = entries.map(([k,f],i) => \`
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span class="place-badge" style="flex-shrink:0">\${ordinal(i+1)}</span>
      <span style="font-weight:700;min-width:72px">\${fmtMs(f.elapsedMs)}</span>
      \${f.bib
        ? \`<span style="color:var(--accent);font-weight:700;font-size:0.9rem">Bib \${f.bib}</span>\`
        : \`<button class="btn btn-secondary btn-sm" onclick="marshalEditBib('\${k}',\${i+1},\${f.elapsedMs})">+ Bib</button>\`}
      <span style="flex:1;font-size:0.75rem;color:var(--muted);text-align:right">\${f.marshalName||''}</span>
    </div>\`).join('');
}

async function marshalTap() {
  if (!xcState || xcState.state!=='live') { toast('Race not live'); return; }
  const elapsed = nowServer() - xcState.startedAtServer;
  const count   = Object.keys(xcState.finishes||{}).length;
  const place   = count + 1;

  tapFlash(); vibrate([70]);

  // Client-side key
  const key = myId.slice(0,4) + '-' + Date.now().toString(36);
  xcCapturePhoto(key); // fire-and-forget photo burst

  await cRef(\`xc/current/finishes/\${key}\`).set({
    marshalId:   myId,
    marshalName: myName || 'Marshal',
    bib:         '',
    name:        '',
    elapsedMs:   elapsed,
    tapAt:       firebase.database.ServerValue.TIMESTAMP
  });

  toast(\`\${ordinal(place)} \u2014 \${fmtMs(elapsed)}\`);

  // Queue bib entry
  bibPendingQueue.push({ key, place, elapsed });
  updateTapBtnLabel();
  if (!bibPendingKey) showNextBib();
}

let _xcAutoConfirmTimer = null; // FIX 2: auto-confirm countdown handle

function xcCancelAutoConfirm() {
  if (_xcAutoConfirmTimer) { clearInterval(_xcAutoConfirmTimer); _xcAutoConfirmTimer = null; }
  const btn = document.getElementById('ocr-btn');
  if (btn) btn.textContent = '\u{1F50D} Auto';
}

function showNextBib() {
  xcCancelAutoConfirm(); // clear any running countdown
  if (!bibPendingQueue.length) { hideBibPad(); return; }
  const { key, place, elapsed, autoDetected } = bibPendingQueue[0];
  bibPendingKey = key;
  bibValue      = '';
  document.getElementById('marshal-bib-for').textContent     = \`\${autoDetected ? '\u{1F916} Auto-detected' : 'Bib for'} \${ordinal(place)} \u2014 \${fmtMs(elapsed)}\`;
  document.getElementById('marshal-bib-display').textContent = '_';
  document.getElementById('marshal-bib-pad').classList.remove('hidden');
  document.getElementById('marshal-finishes-wrap').style.paddingBottom = '0';

  // Show photo (may arrive async), then auto-OCR if autoDetected
  const updatePhoto = () => {
    const photo = xcPhotos.get(key);
    const img   = document.getElementById('finish-photo-img');
    const ph    = document.getElementById('finish-photo-status');
    if (!img) return;
    if (photo) {
      img.src = photo; img.style.display = 'block';
      if (ph) ph.style.display = 'none';
      const btn = document.getElementById('ocr-btn');
      if (btn) btn.textContent = '\u{1F50D} Auto';
      // FIX 2: auto-fire OCR for auto-detected finishes
      if (autoDetected) xcAutoOCRAndConfirm(key);
    } else if (photo === null) {
      if (ph) { ph.style.display=''; ph.textContent='\u{1F4F7} Capturing\u2026'; }
      img.style.display = 'none';
      setTimeout(updatePhoto, 350);
    } else {
      if (ph) { ph.style.display=''; ph.textContent='No camera'; }
      img.style.display = 'none';
      // No photo \u2014 still auto-confirm after delay for autoDetected (bib unknown)
      if (autoDetected) xcStartAutoConfirmCountdown(null);
    }
  };
  updatePhoto();
}

async function xcAutoOCRAndConfirm(key) {
  // Try OCR on the finish photo
  const photoDataUrl = xcPhotos.get(key);
  if (!photoDataUrl) { xcStartAutoConfirmCountdown(null); return; }
  const btn = document.getElementById('ocr-btn');
  if (btn) btn.textContent = '\u23F3 OCR\u2026';
  try {
    if (!_ocrWorker) {
      _ocrWorker = await Tesseract.createWorker('eng');
      await _ocrWorker.setParameters({ tessedit_char_whitelist: '0123456789' });
    }
    const { data: { text, confidence } } = await _ocrWorker.recognize(photoDataUrl);
    const digits = text.replace(/\\D/g,'').slice(0,4);
    if (digits && confidence > 55) {
      bibValue = digits;
      document.getElementById('marshal-bib-display').textContent = bibValue;
      if (btn) btn.textContent = '\u2713 ' + digits;
      xcStartAutoConfirmCountdown(digits);
    } else {
      if (btn) btn.textContent = '\u{1F50D} Auto';
      xcStartAutoConfirmCountdown(null); // no bib read \u2014 still auto-confirm (skip)
    }
  } catch(e) {
    if (btn) btn.textContent = '\u{1F50D} Auto';
    xcStartAutoConfirmCountdown(null);
  }
}

function xcStartAutoConfirmCountdown(detectedBib) {
  let secs = 4;
  const btn = document.getElementById('ocr-btn');
  _xcAutoConfirmTimer = setInterval(() => {
    secs--;
    if (secs > 0) {
      if (btn && detectedBib) btn.textContent = \`\u2713 \${detectedBib} (\${secs}s)\`;
      else if (btn) btn.textContent = \`Skip (\${secs}s)\`;
    } else {
      xcCancelAutoConfirm();
      // Marshal didn't intervene \u2014 auto-confirm (or auto-skip if no bib)
      if (bibPendingKey) bibConfirm();
    }
  }, 1000);
}

function hideBibPad() {
  document.getElementById('marshal-bib-pad').classList.add('hidden');
  bibPendingKey = null;
  updateTapBtnLabel();
}

function updateTapBtnLabel() {
  const sub = document.getElementById('marshal-tap-sub');
  if (!sub) return;
  const n = bibPendingQueue.length;
  sub.textContent = n > 0 ? \`TAP FINISH  \xB7  +\${n} queued\` : 'TAP FINISH';
}

function bibDigit(d) {
  xcCancelAutoConfirm(); // marshal is intervening \u2014 stop countdown
  if (bibValue.length >= 4) return;
  bibValue += d;
  document.getElementById('marshal-bib-display').textContent = bibValue || '_';
}

function bibBack() {
  xcCancelAutoConfirm(); // marshal is intervening \u2014 stop countdown
  bibValue = bibValue.slice(0,-1);
  document.getElementById('marshal-bib-display').textContent = bibValue || '_';
}

async function bibConfirm() {
  if (bibPendingKey) {
    const updates = {};
    if (bibValue) updates.bib = bibValue;
    // Save compressed photo to Firebase (base64 JPEG ~15-20KB)
    const photo = xcPhotos.get(bibPendingKey);
    if (photo) updates.photo = photo;
    if (Object.keys(updates).length) {
      await cRef(\`xc/current/finishes/\${bibPendingKey}\`).update(updates);
    }
  }
  bibPendingQueue.shift();
  bibPendingKey = null;
  showNextBib();
  updateTapBtnLabel();
}

function bibSkip() {
  bibPendingQueue.shift();
  bibPendingKey = null;
  showNextBib();
  updateTapBtnLabel();
}

function marshalEditBib(key, place, elapsed) {
  // Edit bib for an already-tapped finisher
  bibPendingQueue.unshift({ key, place, elapsed });
  if (!bibPendingKey) showNextBib();
}

async function marshalUndo() {
  if (!xcState) return;
  const finishes = xcState.finishes||{};
  const mine = Object.entries(finishes)
    .filter(([k,f])=>f.marshalId===myId)
    .sort((a,b)=>(b[1].tapAt||0)-(a[1].tapAt||0));
  if (!mine.length) { toast('Nothing to undo'); return; }
  const [key, last] = mine[0];
  const total = Object.keys(finishes).length;
  modal('Undo last tap',
    \`Remove tap at \${fmtMs(last.elapsedMs)}? (\${total} total finishers)\`,
    [
      { label:'Undo', cls:'btn-danger', fn: async ()=>{
        await cRef(\`xc/current/finishes/\${key}\`).remove();
        // Remove from bib queue if pending
        bibPendingQueue = bibPendingQueue.filter(q=>q.key!==key);
        if (bibPendingKey===key) { bibPendingKey=null; showNextBib(); }
        toast('Removed');
      }},
      { label:'Cancel' }
    ]);
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// CROSS COUNTRY \u2014 ADMIN VIEW
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function initXCAdminView() {
  requestWakeLock(); syncClock();
  watchConn('xc-admin-dot');
  document.getElementById('xc-admin-school-lbl').textContent = carnivalMeta?.school||'';

  const ageSel=document.getElementById('xc-age-sel');
  ageSel.innerHTML=AGE_GROUPS.map(a=>\`<option>\${a}</option>\`).join('');
  const evSel=document.getElementById('xc-event-sel');
  evSel.innerHTML=EVENTS.xc.map(e=>\`<option>\${e}</option>\`).join('');

  const xcRef=cRef('xc/current');
  xcRef.on('value', snap=>{ xcState=snap.val(); renderXCAdminView(xcState); });
  activeListeners.push(()=>xcRef.off());

  function tick() {
    if (xcState?.state==='live' && xcState.startedAtServer) {
      const el=document.getElementById('xc-admin-clock');
      if(el) el.textContent=fmtMs(nowServer()-xcState.startedAtServer);
    }
    rafId=requestAnimationFrame(tick);
  }
  rafId=requestAnimationFrame(tick);
}

function selectXCGender(g) {
  xcGender=g;
  document.querySelectorAll('[data-xcg]').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll(\`[data-xcg="\${g}"]\`).forEach(p=>p.classList.add('active'));
}

async function xcAdminArm() {
  if (!await _confirmModal('Arm this XC race?', 'All connected timers and the Starter will be notified.', 'ARM RACE \u2192')) return;
  const age  = document.getElementById('xc-age-sel').value;
  const event= document.getElementById('xc-event-sel').value;
  await cRef('xc/current').set({
    raceId:genId(6), age, gender:xcGender, event,
    state:'armed', finishes:{},
    armedAt:firebase.database.ServerValue.TIMESTAMP
  });
  toast('XC Race armed');
}

async function xcAdminGo() {
  if (!xcState || xcState.state!=='armed') return;
  document.getElementById('xc-go-btn').setAttribute('disabled','');
  showCountdown(async ()=>{
    await cRef('xc/current').update({state:'live', startedAtServer:firebase.database.ServerValue.TIMESTAMP});
  });
}

async function xcAdminRecall() {
  await cRef('xc/current').update({state:'armed', startedAtServer:null});
  broadcastRecall();
}

async function xcAdminAbandon() {
  modal('Abandon Race','Return to setup?',[
    { label:'Abandon', cls:'btn-danger', fn:async()=>{
      await cRef('xc/current').set({state:'idle'});
    }},
    { label:'Cancel' }
  ]);
}

async function xcAdminPublish() {
  if (!xcState) return;
  const finishes = xcState.finishes||{};
  const sorted   = Object.entries(finishes).sort((a,b)=>(a[1].tapAt||0)-(b[1].tapAt||0));

  const numQual = parseInt(document.getElementById('xc-qual-spots')?.value)||0;

  if (!await _confirmModal(
    'Publish XC Results',
    \`\${sorted.length} finisher\${sorted.length!==1?'s':''} \xB7 \${numQual} qualifier spot\${numQual!==1?'s':''}\`,
    'PUBLISH \u2192'
  )) return;

  toast('Publishing & generating cards\u2026');

  // Generate finish cards for finishers with photos
  const cards = {};
  for (let i = 0; i < sorted.length; i++) {
    const [k, f] = sorted[i];
    const place = i + 1;
    try {
      cards[place] = await generateFinishCard({
        place, name: f.name || (f.bib ? 'Bib ' + f.bib : 'Finisher ' + place),
        elapsedMs: f.elapsedMs, photo: f.photo||null,
        age: xcState.age, gender: xcState.gender,
        event: xcState.event, school: carnivalMeta?.school||''
      });
    } catch(e) { /* skip bad frames */ }
  }

  const key = fbEnc(\`xc-\${xcState.age}-\${xcState.gender}-\${xcState.event}-\${xcState.raceId}\`);
  await cRef(\`results/\${key}\`).set({
    type:'xc', age:xcState.age, gender:xcState.gender, event:xcState.event,
    raceId:xcState.raceId,
    qualifierSpots: numQual,
    places: sorted.map(([k,f],i) => ({
      place:       i + 1,
      bib:         f.bib||'',
      name:        f.name||'',
      elapsedMs:   f.elapsedMs,
      qualifier:   numQual > 0 && (i+1) <= numQual,
      ...(cards[i+1] ? { card: cards[i+1] } : {})
    })),
    publishedAt: firebase.database.ServerValue.TIMESTAMP
  });
  await cRef('xc/current').update({state:'done'});

  const qualMsg = numQual ? \` \xB7 \${Math.min(numQual, sorted.length)} qualifier\${numQual!==1?'s':''} flagged\` : '';
  toast('XC published!' + qualMsg);

  // Offer to view finish cards if any were generated
  const cardCount = Object.keys(cards).length;
  if (cardCount > 0) {
    setTimeout(() => showFinishCards(cards, sorted, xcState), 1200);
  }
}

// \u2500\u2500 Finish card generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function generateFinishCard({ place, name, elapsedMs, photo, age, gender, event, school }) {
  const W = 400, H = 620;
  const c   = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  if (photo) {
    try {
      await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          // Fill top 62% with finish photo
          ctx.drawImage(img, 0, 0, W, Math.round(H * 0.62));
          res();
        };
        img.onerror = rej;
        img.src = photo;
      });
      // Gradient fade from photo to dark
      const g = ctx.createLinearGradient(0, H*0.38, 0, H*0.62);
      g.addColorStop(0, 'rgba(13,17,23,0)');
      g.addColorStop(1, 'rgba(13,17,23,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } catch(e) {
      // No photo fallback \u2014 teal gradient background
      const g2 = ctx.createLinearGradient(0, 0, W, H*0.5);
      g2.addColorStop(0, '#0d1117'); g2.addColorStop(1, '#0d4040');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H*0.62);
    }
  } else {
    const g2 = ctx.createLinearGradient(0, 0, W, H*0.5);
    g2.addColorStop(0, '#0d1117'); g2.addColorStop(1, '#0d3030');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H*0.62);
    // Camera icon placeholder
    ctx.fillStyle = '#30363d';
    ctx.font = '64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1F3C3}', W/2, H*0.32);
  }

  const baseY = H * 0.64;

  // Accent stripe
  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(0, baseY - 4, W, 4);

  // Place text \u2014 gold / silver / bronze / teal
  const placeColors = ['#FFD700','#C0C0C0','#CD7F32'];
  const placeText   = ['1ST','2ND','3RD'][place-1] || (place + 'TH');
  ctx.fillStyle  = placeColors[place-1] || '#14b8a6';
  ctx.font       = \`900 \${place<=3?80:64}px Arial\`;
  ctx.textAlign  = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur  = 8;
  ctx.fillText(placeText, W/2, baseY + 72);
  ctx.shadowBlur = 0;

  // Name
  ctx.fillStyle = '#f0f6fc';
  ctx.font      = 'bold 34px Arial';
  const displayName = name.length > 20 ? name.slice(0,19) + '\u2026' : name;
  ctx.fillText(displayName, W/2, baseY + 120);

  // Time
  ctx.fillStyle = '#14b8a6';
  ctx.font      = 'bold 26px Arial';
  ctx.fillText(fmtMs(elapsedMs), W/2, baseY + 158);

  // Event info
  ctx.fillStyle = '#8b949e';
  ctx.font      = '17px Arial';
  ctx.fillText(\`\${age} \${gender}  \xB7  \${event}\`, W/2, baseY + 186);

  // School
  if (school) {
    ctx.fillStyle = '#8b949e';
    ctx.font      = '15px Arial';
    ctx.fillText(school, W/2, baseY + 207);
  }

  // Footer branding bar
  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, H - 38, W, 38);
  ctx.fillStyle = '#30363d';
  ctx.fillRect(0, H - 38, W, 1);
  ctx.fillStyle = '#8b949e';
  ctx.font      = '13px Arial';
  ctx.fillText('carnivaltiming.com', W/2, H - 13);

  return c.toDataURL('image/jpeg', 0.82);
}

// \u2500\u2500 Show finish cards slideshow after publish \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function showFinishCards(cards, sorted, xc) {
  let idx = 0;
  const keys = Object.keys(cards).map(Number).sort((a,b)=>a-b);
  if (!keys.length) return;

  const overlay = document.createElement('div');
  overlay.id = 'finish-card-overlay';

  const render = () => {
    const place = keys[idx];
    const [, f] = sorted[place-1] || sorted[0];
    overlay.innerHTML = \`
      <img src="\${cards[place]}" style="max-width:min(320px,85vw);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.6)">
      <div style="color:#f0f6fc;font-size:0.9rem;text-align:center;opacity:0.7">\${place} of \${keys.length} \xB7 tap to share</div>
      <div class="card-actions">
        \${idx > 0 ? '<button class="btn btn-secondary btn-sm" id="_fc-prev">\u2190 Prev</button>' : ''}
        <button class="btn btn-primary btn-sm" id="_fc-share">Share \u{1F4E4}</button>
        \${idx < keys.length-1 ? '<button class="btn btn-secondary btn-sm" id="_fc-next">Next \u2192</button>' : ''}
        <button class="btn btn-secondary btn-sm" id="_fc-close">\u2715 Close</button>
      </div>\`;

    // Bind buttons
    overlay.querySelector('#_fc-close').onclick = () => document.body.removeChild(overlay);
    const prevBtn = overlay.querySelector('#_fc-prev');
    const nextBtn = overlay.querySelector('#_fc-next');
    const shareBtn = overlay.querySelector('#_fc-share');
    if (prevBtn) prevBtn.onclick = () => { idx--; render(); };
    if (nextBtn) nextBtn.onclick = () => { idx++; render(); };
    shareBtn.onclick = async () => {
      const dataUrl  = cards[place];
      const blob     = await (await fetch(dataUrl)).blob();
      const file     = new File([blob], \`finish-\${xc.age}-\${xc.gender}-place\${place}.jpg\`, {type:'image/jpeg'});
      if (navigator.canShare && navigator.canShare({files:[file]})) {
        navigator.share({ files:[file], title: \`\${ordinal(place)} Place \u2014 \${xc.age} \${xc.gender}\` }).catch(()=>{});
      } else {
        const a = document.createElement('a');
        a.href = dataUrl; a.download = file.name; a.click();
      }
    };
  };

  render();
  document.body.appendChild(overlay);
}

function renderXCAdminView(xc) {
  const setup=document.getElementById('xc-setup-panel');
  const live =document.getElementById('xc-live-panel');

  if (!xc || xc.state==='idle') {
    setup.classList.remove('hidden'); live.classList.add('hidden'); return;
  }
  setup.classList.add('hidden'); live.classList.remove('hidden');

  document.getElementById('xc-race-lbl').textContent = \`\${xc.age||''} \${xc.gender||''} \xB7 \${xc.event||''}\`;
  const badge  = document.getElementById('xc-state-badge');
  const goBtn  = document.getElementById('xc-go-btn');
  const pubBtn = document.getElementById('xc-publish-btn');

  if (xc.state==='armed') {
    badge.className='badge badge-armed'; badge.textContent='ARMED';
    goBtn.removeAttribute('disabled'); pubBtn.classList.add('hidden');
    document.getElementById('xc-admin-clock').textContent='0:00.00';
  } else if (xc.state==='live') {
    badge.className='badge badge-live'; badge.textContent='LIVE';
    goBtn.setAttribute('disabled',''); pubBtn.classList.remove('hidden');
  } else if (xc.state==='done') {
    badge.className='badge badge-done'; badge.textContent='DONE';
    pubBtn.classList.add('hidden');
  }

  const finishes = xc.finishes||{};
  const entries = Object.entries(finishes)
    .sort((a,b)=>(a[1].tapAt||0)-(b[1].tapAt||0));
  document.getElementById('xc-count-lbl').textContent = entries.length ? \`\${entries.length} finishers\` : '';

  const qualN = parseInt(document.getElementById('xc-qual-spots')?.value)||0;
  document.getElementById('xc-finishers-list').innerHTML = entries.map(([k,f],i)=>\`
    <div class="result-row" style="display:flex;align-items:center;gap:6px">
      <span class="place-badge">\${ordinal(i+1)}</span>
      \${f.photo ? '<span style="font-size:0.8rem" title="Photo captured">\u{1F4F7}</span>' : ''}
      <span class="result-name" style="flex:1">\${f.name||(f.bib?'Bib '+f.bib:'\u2014')}</span>
      \${qualN > 0 && (i+1) <= qualN ? '<span class="qualifier-chip">\u{1F3C5} QUAL</span>' : ''}
      <span class="result-time">\${fmtMs(f.elapsedMs)}</span>
    </div>\`).join('');
}

async function exportCSV() {
  const btn = event && event.currentTarget;
  if (btn) { btn.setAttribute('disabled',''); btn.textContent='Exporting\u2026'; }
  try {
    const snap = await cRef('results').once('value');
    const results = snap.val() || {};
    const rows = [['Type','Age','Gender','Event','Place','Name','Time (s)','DQ']];
    Object.values(results)
      .sort((a,b)=>(a.publishedAt||0)-(b.publishedAt||0))
      .forEach(r => {
        if (r.type==='xc') {
          (r.places||[]).forEach(p => {
            rows.push(['XC',r.age||'',r.gender||'',r.event||'',p.place||'',p.name||'',(p.elapsedMs/1000).toFixed(2),'']);
          });
        } else {
          (r.results||[]).forEach(l => {
            const dqFlag = l.dq ? 'Y' : '';
            rows.push(['Lane',r.age||'',r.gender||'',r.event||'',l.dq?'DQ':(l.place||''),l.name||\`Lane \${l.lane}\`,l.dq?'':(l.timeMs/1000).toFixed(2),dqFlag]);
          });
        }
      });
    const csv = rows.map(r=>r.map(c=>\`"\${String(c).replace(/"/g,'\\"')}"\`)  .join(',')).join('\\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`results-\${carnivalCode||'carnival'}-\${new Date().toISOString().slice(0,10)}.csv\`;
    a.click();
  } catch(e) { toast('Export failed: ' + e.message); }
  if (btn) { btn.removeAttribute('disabled'); btn.textContent='Export CSV'; }
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// \u2500\u2500 VIDEO FINISH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// STATE
// \u2500\u2500 Video Finish: slit camera state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let vfStream        = null;
let vfRaceStartMs   = 0;
let vfOfflineMode   = false;
let vfDetections    = [];
let vfLiveRafId     = null;
let vfLiveState     = 'idle';   // idle|calibrating|ready|detecting|done
let vfLiveOffscr    = null;
let vfFacingMode2   = 'environment';  // renamed to avoid conflict with Task7 var
// Slit camera
let vfSlitInternal  = null;     // canvas holding full slit history
let vfSlitICtx      = null;
const VF_SLIT_W     = 5400;    // ~90s at 60fps
const VF_SLIT_H     = 200;
let vfSlitPos       = 0;        // columns written
let vfGoColumn      = -1;       // column where GO fired
let vfSlitX         = 0.5;     // slit line position (0\u20131)
let vfBgAccum       = null;    // Float32Array[VF_SLIT_H] background model
let vfBgN           = 0;
let vfLastDetectCol = -999;
let vfDragging      = false;

function vfGetOffset()      { return parseInt(document.getElementById('vf-offset-input')?.value||0,10)||0; }
function vfGetProgress()    { return parseInt(document.getElementById('vf-progress-input')?.value||2,10)||2; }
function vfGetSensitivity() { return parseInt(document.getElementById('vf-sensitivity')?.value||6,10)||6; }

// \u2500\u2500 Init \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function initVideoFinish() {
  requestWakeLock(); syncClock();

  // Init slit canvas (OffscreenCanvas not available in all mobile browsers \u2014 use regular canvas)
  vfSlitInternal = document.createElement('canvas');
  vfSlitInternal.width  = VF_SLIT_W;
  vfSlitInternal.height = VF_SLIT_H;
  vfSlitICtx = vfSlitInternal.getContext('2d', { willReadFrequently: true });
  vfSlitICtx.fillStyle = '#111';
  vfSlitICtx.fillRect(0, 0, VF_SLIT_W, VF_SLIT_H);
  vfSlitPos       = 0;
  vfGoColumn      = -1;
  vfBgAccum       = new Float32Array(VF_SLIT_H);
  vfBgN           = 0;
  vfLiveState     = 'idle';
  vfDetections    = [];
  vfLiveRafId     = null;
  vfLastDetectCol = -999;
  vfSlitX         = 0.5;

  // Sensitivity slider live label
  const sensSlider = document.getElementById('vf-sensitivity');
  if (sensSlider) sensSlider.oninput = () => {
    const lbl = document.getElementById('vf-sens-val');
    if (lbl) lbl.textContent = sensSlider.value;
  };

  // Wire up slit line drag on live canvas
  const liveCanvas = document.getElementById('vf-live-canvas');
  if (liveCanvas) {
    liveCanvas.addEventListener('mousedown',  vfDragStart, { passive: false });
    liveCanvas.addEventListener('mousemove',  vfDragMove,  { passive: false });
    window.addEventListener('mouseup',        vfDragEnd);
    liveCanvas.addEventListener('touchstart', vfDragStart, { passive: false });
    liveCanvas.addEventListener('touchmove',  vfDragMove,  { passive: false });
    window.addEventListener('touchend',       vfDragEnd);
  }

  // Watch race state
  const ref = cRef('race/current');
  ref.on('value', snap => {
    const rc = snap.val();
    if (!rc) return;
    if (rc.state === 'live' && rc.startedAtServer) {
      if (!vfRaceStartMs) {
        vfRaceStartMs = rc.startedAtServer;
        vfGoColumn    = vfSlitPos;
        vfDrawGoMarker();
      }
      vfOfflineMode = false;
      if (vfLiveState === 'calibrating' || vfLiveState === 'ready') {
        vfLiveState = 'detecting';
        vfSetStatus('\u{1F534} Race live \u2014 detecting crossings', '#ef4444');
      }
    } else if (rc.state === 'armed') {
      vfRaceStartMs = 0; vfGoColumn = -1;
      if (vfLiveState === 'detecting' || vfLiveState === 'done') vfLiveState = 'ready';
      vfSetStatus('\u26A1 Armed \u2014 waiting for GO', '#eab308');
    }
  });
  activeListeners.push(() => ref.off());

  vfStartCamera();
}

function vfSetStatus(text, dotColor) {
  const el  = document.getElementById('vf-race-status');
  const dot = document.getElementById('vf-status-dot');
  if (el)  el.textContent = text;
  if (dot) dot.style.background = dotColor || 'var(--muted)';
}

function vfStartCamera() {
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: vfFacingMode2, width:{ideal:1920}, height:{ideal:1080}, frameRate:{ideal:60} },
    audio: false
  }).then(stream => {
    vfStream = stream;
    const vid = document.getElementById('vf-video-preview');
    vid.srcObject = stream; vid.play();
    vid.addEventListener('playing', () => {
      vfLiveState = 'calibrating';
      vfSetStatus('Calibrating\u2026', '#6b7280');
      toast('Camera ready \u2014 calibrating\u2026');
      if (!vfLiveRafId) vfLiveRafId = requestAnimationFrame(vfLiveFrame);
    }, { once: true });
  }).catch(err => {
    const msg = err?.name === 'NotFoundError'   ? 'No camera found on this device'
              : err?.name === 'NotAllowedError' ? 'Camera access denied \u2014 check browser permissions'
              : 'Camera error: ' + (err?.message || err);
    toast(msg); vfSetStatus('\u26A0 ' + msg, '#ef4444');
    const canvas = document.getElementById('vf-live-canvas');
    if (canvas) {
      canvas.style.display = 'none';
      const errDiv = document.createElement('div');
      errDiv.id = 'vf-cam-error';
      errDiv.style.cssText = 'text-align:center;padding:32px 16px;background:var(--surface-2);border-radius:12px;margin-bottom:10px';
      errDiv.innerHTML = \`<div style="font-size:2rem;margin-bottom:8px">\u{1F4F7}</div><div style="color:var(--danger);font-weight:600;margin-bottom:16px">\${msg}</div><button class="btn btn-primary" onclick="vfRetryCamera()">Retry Camera</button>\`;
      canvas.parentNode.insertBefore(errDiv, canvas);
    }
  });
}

// \u2500\u2500 Slit line drag \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfDragStart(e) {
  e.preventDefault(); vfDragging = true; vfDragMove(e);
}
function vfDragMove(e) {
  if (!vfDragging) return;
  e.preventDefault();
  const canvas = document.getElementById('vf-live-canvas');
  if (!canvas) return;
  const rect   = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  vfSlitX = Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width));
}
function vfDragEnd() { vfDragging = false; }

// \u2500\u2500 Main RAF loop \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfLiveFrame() {
  vfLiveRafId = null;
  if (vfLiveState === 'idle') return;

  const vid = document.getElementById('vf-video-preview');
  if (!vid || !vid.videoWidth) { vfLiveRafId = requestAnimationFrame(vfLiveFrame); return; }

  // Grab frame
  if (!vfLiveOffscr) vfLiveOffscr = document.createElement('canvas');
  const oc = vfLiveOffscr;
  oc.width = vid.videoWidth; oc.height = vid.videoHeight;
  const octx = oc.getContext('2d', { willReadFrequently: true });
  octx.drawImage(vid, 0, 0);

  // Draw live preview with slit line
  vfDrawLiveOverlay(oc);

  // Extract slit column (1px wide, full height)
  const slitPixelX = Math.round(vfSlitX * (oc.width - 1));
  const rawCol = octx.getImageData(slitPixelX, 0, 1, oc.height);

  // Scale to VF_SLIT_H
  const scaledCol = vfScaleColumn(rawCol, oc.height, VF_SLIT_H);

  // Stamp into slit canvas at current position
  if (vfSlitPos < VF_SLIT_W) {
    vfSlitICtx.putImageData(scaledCol, vfSlitPos, 0);
  }

  // Calibration: build background model for ~90 frames (~1.5s)
  if (vfLiveState === 'calibrating') {
    vfBuildBg(scaledCol);
    if (vfBgN >= 90) {
      vfLiveState = vfRaceStartMs ? 'detecting' : 'ready';
      vfSetStatus(vfRaceStartMs ? '\u{1F534} Detecting\u2026' : '\u2713 Ready \u2014 waiting for GO',
                  vfRaceStartMs ? '#ef4444' : '#22c55e');
      toast('Ready!');
    }
  } else if (vfLiveState === 'detecting') {
    vfCheckCrossing(scaledCol);
    // Slowly adapt background to handle lighting changes (skip while crossing active)
    if (vfSlitPos - vfLastDetectCol > 120) vfAdaptBg(scaledCol, 0.015);
  }

  // Render slit display
  vfRenderSlit();

  // Advance position; shift canvas if full
  vfSlitPos++;
  if (vfSlitPos >= VF_SLIT_W) {
    const half = VF_SLIT_W >> 1;
    const img = vfSlitICtx.getImageData(half, 0, VF_SLIT_W - half, VF_SLIT_H);
    vfSlitICtx.fillStyle = '#111';
    vfSlitICtx.fillRect(0, 0, VF_SLIT_W, VF_SLIT_H);
    vfSlitICtx.putImageData(img, 0, 0);
    vfSlitPos       -= half;
    if (vfGoColumn  >= 0) vfGoColumn -= half;
    vfLastDetectCol -= half;
    vfDetections.forEach(d => { if (d._col >= 0) d._col -= half; });
  }

  vfLiveRafId = requestAnimationFrame(vfLiveFrame);
}

// \u2500\u2500 Live camera overlay with draggable slit line \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfDrawLiveOverlay(offscr) {
  const canvas = document.getElementById('vf-live-canvas');
  if (!canvas) return;
  canvas.width = offscr.width; canvas.height = offscr.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(offscr, 0, 0);

  const sx = Math.round(vfSlitX * offscr.width);
  const h  = offscr.height;
  const lineColor = vfLiveState === 'detecting' ? '#ef4444'
                  : vfLiveState === 'ready'     ? '#22c55e'
                  : '#eab308';
  ctx.save();
  // Slit line
  ctx.strokeStyle = lineColor; ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
  ctx.setLineDash([10, 5]);
  ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
  ctx.setLineDash([]);
  // Drag handle
  ctx.fillStyle = lineColor;
  ctx.beginPath(); ctx.arc(sx, h >> 1, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowBlur = 0; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('\u21D4', sx, (h >> 1) + 5);
  // Label
  ctx.textAlign = 'left'; ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = lineColor;
  ctx.fillText('FINISH LINE', sx + 20, 20);
  ctx.restore();
}

// \u2500\u2500 Scale pixel column to target height \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfScaleColumn(rawCol, srcH, dstH) {
  const out = new ImageData(1, dstH);
  for (let y = 0; y < dstH; y++) {
    const srcY = Math.round(y * (srcH - 1) / (dstH - 1));
    const si = srcY * 4, di = y * 4;
    out.data[di]   = rawCol.data[si];
    out.data[di+1] = rawCol.data[si+1];
    out.data[di+2] = rawCol.data[si+2];
    out.data[di+3] = 255;
  }
  return out;
}

// \u2500\u2500 Background model \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfBuildBg(col) {
  const n = vfBgN;
  for (let y = 0; y < VF_SLIT_H; y++) {
    const i = y * 4;
    const g = (col.data[i]*77 + col.data[i+1]*150 + col.data[i+2]*29) >> 8;
    vfBgAccum[y] = (vfBgAccum[y] * n + g) / (n + 1);
  }
  vfBgN++;
}
function vfAdaptBg(col, rate) {
  for (let y = 0; y < VF_SLIT_H; y++) {
    const i = y * 4;
    const g = (col.data[i]*77 + col.data[i+1]*150 + col.data[i+2]*29) >> 8;
    vfBgAccum[y] += (g - vfBgAccum[y]) * rate;
  }
}

// \u2500\u2500 Crossing detection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfCheckCrossing(col) {
  if (!vfBgAccum || vfBgN < 10 || !vfRaceStartMs) return;
  const debounce = Math.max(20, 60 - vfGetSensitivity() * 4); // 20\u201356 frames
  if (vfSlitPos - vfLastDetectCol < debounce) return;

  const nowMs    = nowServer();
  const elapsed  = nowMs - vfRaceStartMs - vfGetOffset();
  if (elapsed < 300) return; // ignore first 300ms (GO noise)

  const sens      = vfGetSensitivity();              // 1\u201310
  const threshold = Math.max(6, 38 - sens * 3);     // 8 (sens=10) \u2013 35 (sens=1)
  const minRows   = Math.round(VF_SLIT_H * (0.35 - sens * 0.02)); // 15%\u201333% of height

  let diffCount = 0;
  for (let y = 0; y < VF_SLIT_H; y++) {
    const i = y * 4;
    const g = (col.data[i]*77 + col.data[i+1]*150 + col.data[i+2]*29) >> 8;
    if (Math.abs(g - vfBgAccum[y]) > threshold) diffCount++;
  }

  if (diffCount >= minRows) {
    vfLastDetectCol = vfSlitPos;
    const still = vfCaptureStill();
    const entry = { place: vfDetections.length + 1, elapsedMs: elapsed, still, _col: vfSlitPos };
    vfDetections.push(entry);
    vfDetections.sort((a,b) => a.elapsedMs - b.elapsedMs);
    vfDetections.forEach((d,i) => d.place = i + 1);
    vfRenderDetections();
    toast(\`Finish #\${vfDetections.length}: \${fmtMs(elapsed)}\`);
    const dc = document.getElementById('vf-detect-count');
    if (dc) dc.textContent = \`\${vfDetections.length} detected\`;
    // Draw crossing marker on slit canvas
    vfMarkCrossing(vfSlitPos, elapsed, vfDetections.length);
  }
}

function vfCaptureStill() {
  if (!vfLiveOffscr) return null;
  try {
    const tmp = document.createElement('canvas');
    tmp.width = 160; tmp.height = 90;
    tmp.getContext('2d').drawImage(vfLiveOffscr, 0, 0, 160, 90);
    return tmp.toDataURL('image/jpeg', 0.7);
  } catch(e) { return null; }
}

// \u2500\u2500 Slit canvas markers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfDrawGoMarker() {
  if (!vfSlitICtx || vfGoColumn < 0) return;
  vfSlitICtx.save();
  vfSlitICtx.fillStyle = 'rgba(234,179,8,0.9)';
  vfSlitICtx.fillRect(vfGoColumn, 0, 3, VF_SLIT_H);
  vfSlitICtx.fillStyle = '#eab308';
  vfSlitICtx.font = 'bold 11px sans-serif';
  vfSlitICtx.fillText('GO', Math.min(vfGoColumn + 5, VF_SLIT_W - 30), 14);
  vfSlitICtx.restore();
}

function vfMarkCrossing(col, elapsedMs, place) {
  if (!vfSlitICtx) return;
  vfSlitICtx.save();
  vfSlitICtx.fillStyle = 'rgba(59,130,246,0.85)';
  vfSlitICtx.fillRect(col, 0, 2, VF_SLIT_H);
  vfSlitICtx.fillStyle = '#60a5fa';
  vfSlitICtx.font = 'bold 11px sans-serif';
  const lx = Math.min(col + 4, VF_SLIT_W - 60);
  vfSlitICtx.fillText(\`#\${place}\`, lx, 14);
  vfSlitICtx.fillText(fmtMs(elapsedMs), lx, 27);
  vfSlitICtx.restore();
}

// \u2500\u2500 Render slit display canvas \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfRenderSlit() {
  const display = document.getElementById('vf-slit-canvas');
  if (!display || !vfSlitICtx) return;
  const dw = display.offsetWidth || 360;
  const dh = 140;
  if (display.width !== dw)  display.width  = dw;
  if (display.height !== dh) display.height = dh;
  const ctx = display.getContext('2d');
  const available = Math.min(vfSlitPos, VF_SLIT_W);
  if (available < 1) { ctx.fillStyle='#111'; ctx.fillRect(0,0,dw,dh); return; }
  // Show the most recent dw columns (scroll left as time advances)
  const showCols = Math.min(available, dw * 2);
  const srcX     = Math.max(0, available - showCols);
  ctx.drawImage(vfSlitInternal, srcX, 0, showCols, VF_SLIT_H, 0, 0, dw, dh);
}

// \u2500\u2500 Export slit image as PNG \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfExportSlit() {
  if (!vfSlitInternal || vfSlitPos === 0) { toast('No slit image yet \u2014 wait for the race'); return; }
  const used = Math.min(vfSlitPos, VF_SLIT_W);
  const tmp = document.createElement('canvas');
  tmp.width = used; tmp.height = VF_SLIT_H;
  tmp.getContext('2d').drawImage(vfSlitInternal, 0, 0, used, VF_SLIT_H, 0, 0, used, VF_SLIT_H);
  const link = document.createElement('a');
  link.href     = tmp.toDataURL('image/png');
  link.download = \`finish-\${new Date().toISOString().slice(0,16).replace('T','-')}.png\`;
  link.click();
  toast('Finish line photo saved!');
}

// \u2500\u2500 Results list \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfRenderDetections() {
  const list = document.getElementById('vf-mark-list');
  if (!list) return;
  if (!vfDetections.length) {
    list.innerHTML = '<div class="text-muted text-sm text-center mt-8">No finishes detected yet</div>'; return;
  }
  const progN = vfGetProgress();
  list.innerHTML = vfDetections.map((d,i) => \`
    <div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">
      <span class="place-badge">\${ordinal(d.place||i+1)}</span>
      <span style="font-weight:700;font-size:1rem;min-width:80px;font-family:monospace">\${fmtMs(d.elapsedMs)}</span>
      \${(d.place||i+1) <= progN ? '<span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:700">PROGRESSES</span>' : ''}
      \${d.still ? \`<img src="\${d.still}" style="width:64px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">\` : ''}
      <button class="vf-mark-btn" style="color:var(--danger);margin-left:auto" onclick="vfRemove(\${i})">&#x2715;</button>
    </div>\`).join('');
}
function vfRemove(i) {
  vfDetections.splice(i,1);
  vfDetections.forEach((d,j) => d.place = j+1);
  vfRenderDetections();
}

// \u2500\u2500 Publish \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function vfPublish() {
  if (!vfDetections.length) { toast('Nothing to publish'); return; }
  const payload = {};
  vfDetections.forEach((d,i) => {
    payload[\`place_\${i+1}\`] = { place: d.place||i+1, elapsedMs: d.elapsedMs };
  });
  await cRef('race/current/videoFinish').set({
    marks: payload, mode: 'slit',
    offsetMs: vfGetOffset(), offlineMode: vfOfflineMode,
    recordedBy: myName || 'Video Finish',
    publishedAt: firebase.database.ServerValue.TIMESTAMP
  });
  toast('Video finish times published!');
  document.getElementById('vf-publish-btn').disabled = true;
}

// \u2500\u2500 Camera flip & retry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfFlipCamera() {
  vfFacingMode2 = (vfFacingMode2 === 'environment') ? 'user' : 'environment';
  toast(\`Switching to \${vfFacingMode2 === 'user' ? 'front' : 'back'} camera\u2026\`);
  const errDiv = document.getElementById('vf-cam-error');
  if (errDiv) errDiv.remove();
  const canvas = document.getElementById('vf-live-canvas');
  if (canvas) canvas.style.display = '';
  if (vfStream)    { vfStream.getTracks().forEach(t=>t.stop()); vfStream=null; }
  if (vfLiveRafId) { cancelAnimationFrame(vfLiveRafId); vfLiveRafId=null; }
  vfLiveState = 'idle';
  vfStartCamera();
}
function vfRetryCamera() {
  const errDiv = document.getElementById('vf-cam-error');
  if (errDiv) errDiv.remove();
  const canvas = document.getElementById('vf-live-canvas');
  if (canvas) canvas.style.display = '';
  vfSetStatus('Starting camera\u2026', 'var(--muted)');
  vfStartCamera();
}

// \u2500\u2500 Cleanup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfExit() {
  if (vfLiveRafId) { cancelAnimationFrame(vfLiveRafId); vfLiveRafId = null; }
  if (vfStream)    { vfStream.getTracks().forEach(t=>t.stop()); vfStream = null; }
  window.removeEventListener('mouseup',  vfDragEnd);
  window.removeEventListener('touchend', vfDragEnd);
  vfLiveState = 'idle'; vfDetections = [];
  vfSlitInternal = null; vfSlitICtx = null;
  enterRole('role');
}

// \u2500\u2500 Manual add \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function vfManualAdd() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = \`
    <div style="background:var(--surface);border-radius:16px;padding:24px;max-width:320px;width:100%">
      <div style="font-weight:700;font-size:1rem;margin-bottom:16px">Add Manual Finish</div>
      <div style="margin-bottom:20px">
        <label style="font-size:0.8rem;color:var(--muted)">Time (m:ss.ms or ss.ms)</label>
        <input id="_mf-time" type="text" placeholder="e.g. 1:23.45 or 83.45"
          style="width:100%;margin-top:4px;padding:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:1rem">
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" style="flex:1" onclick="this.closest('[style]').remove()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" onclick="vfManualSubmit(this)">Add</button>
      </div>
    </div>\`;
  document.body.appendChild(el);
  setTimeout(() => document.getElementById('_mf-time')?.focus(), 100);
}
function vfManualSubmit(btn) {
  const raw = (document.getElementById('_mf-time')?.value || '').trim();
  let ms = 0;
  if (raw.includes(':')) { const [m,s] = raw.split(':'); ms = (parseFloat(m)*60 + parseFloat(s)) * 1000; }
  else ms = parseFloat(raw) * 1000;
  if (!ms || isNaN(ms) || ms <= 0) { toast('Enter a valid time'); return; }
  btn.closest('[style]').remove();
  vfDetections.push({ place: vfDetections.length+1, elapsedMs: Math.round(ms), still: null, _col: -1 });
  vfDetections.sort((a,b) => a.elapsedMs - b.elapsedMs);
  vfDetections.forEach((d,i) => d.place = i+1);
  vfRenderDetections();
  toast(\`Manual finish added: \${fmtMs(Math.round(ms))}\`);
}

// \u2500\u2500 TASK 9: Athlete name persistence \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function _laneKey(age, gender, event) {
  return \`ct_lanes_\${age}_\${gender}_\${event}\`.replace(/\\s+/g,'_');
}
function _saveLaneNames(age, gender, event, lanes) {
  try { localStorage.setItem(_laneKey(age, gender, event), JSON.stringify(lanes)); } catch(e){}
}
function _loadLaneNames(age, gender, event) {
  try {
    const saved = localStorage.getItem(_laneKey(age, gender, event));
    if (!saved) return;
    const lanes = JSON.parse(saved);
    document.querySelectorAll('.admin-lane-name-input').forEach(inp => {
      const n = inp.dataset.lane;
      if (lanes[n]?.name) inp.value = lanes[n].name;
    });
    toast('Names loaded from last heat \u2191');
  } catch(e){}
}

// Auto-load names when dropdowns change (attach after admin view inits)
function _attachLaneNameAutoLoad() {
  const ageSel   = document.getElementById('admin-age-sel');
  const eventSel = document.getElementById('admin-event-sel');
  const load = () => {
    const age   = ageSel?.value;
    const event = eventSel?.value;
    if (age && event && typeof adminGender !== 'undefined') _loadLaneNames(age, adminGender, event);
  };
  if (ageSel)   ageSel.addEventListener('change', load);
  if (eventSel) eventSel.addEventListener('change', load);
}
// Call after a short delay so initAdminView has run
const _origInitAdminView = typeof initAdminView === 'function' ? initAdminView : null;

// \u2500\u2500 TASK 10: Timer undo \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let _timerUndoTimer = null;

function _showTimerUndo(lane, splitKey, elapsedMs) {
  // Clear any existing undo
  if (_timerUndoTimer) { clearTimeout(_timerUndoTimer); _timerUndoTimer = null; }
  const existing = document.getElementById('timer-undo-bar');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'timer-undo-bar';
  bar.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px 20px;display:flex;align-items:center;gap:16px;z-index:9997;box-shadow:0 4px 24px rgba(0,0,0,.4)';
  const timeLeft = document.createElement('span');
  timeLeft.style.cssText = 'font-size:0.85rem;color:var(--muted)';
  timeLeft.textContent = 'Undo stop (3s)';
  const undoBtn = document.createElement('button');
  undoBtn.className = 'btn btn-secondary';
  undoBtn.style.cssText = 'font-size:0.85rem;padding:6px 16px;color:var(--accent);border-color:var(--accent)';
  undoBtn.textContent = '\u21A9 Undo';
  bar.appendChild(timeLeft);
  bar.appendChild(undoBtn);
  document.body.appendChild(bar);

  let secs = 3;
  const tick = setInterval(() => {
    secs--;
    if (secs <= 0) { clearInterval(tick); bar.remove(); }
    else timeLeft.textContent = \`Undo stop (\${secs}s)\`;
  }, 1000);

  undoBtn.onclick = async () => {
    clearInterval(tick);
    clearTimeout(_timerUndoTimer);
    bar.remove();
    try {
      await cRef(\`race/current/splits/\${lane}/\${splitKey}\`).remove();
      const splitBtn = document.getElementById('timer-stop-btn');
      if (splitBtn) { splitBtn.textContent = 'STOP'; splitBtn.removeAttribute('disabled'); }
      toast('\u21A9 Stop undone \u2014 tap STOP again when ready');
    } catch(e) {
      toast('Could not undo \u2014 split already synced');
    }
  };

  _timerUndoTimer = setTimeout(() => { clearInterval(tick); bar.remove(); }, 3000);
}

// \u2500\u2500 TASK 12: Results export \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function adminExportCSV() {
  if (!raceState) { toast('No race data'); return; }
  const lanes  = raceState.lanes  || {};
  const splits = raceState.splits || {};
  const results = [];
  Object.keys(lanes).forEach(lane => {
    const vals = Object.values(splits[lane]||{}).map(s=>s.elapsedMs).filter(Boolean);
    const mean = vals.length ? trimmedMean(vals) : null;
    if (mean != null) results.push({ lane, name: lanes[lane]?.name || \`Lane \${lane}\`, timeMs: mean });
  });
  results.sort((a,b) => a.timeMs - b.timeMs);
  let place = 1;
  results.forEach(r => { r.place = place++; });

  const event   = raceState.event   || '';
  const age     = raceState.age     || '';
  const gender  = raceState.gender  || '';
  const header  = 'Place,Lane,Name,Time\\r\\n';
  const rows    = results.map(r => \`\${r.place},\${r.lane},"\${r.name}",\${fmtSec(r.timeMs)}\`).join('\\r\\n');
  const csv     = header + rows;
  const blob    = new Blob([csv], {type:'text/csv'});
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href = url;
  a.download = \`\${age}-\${gender}-\${event}-results.csv\`.replace(/\\s+/g,'_');
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV downloaded');
}

function adminPrintResults() {
  if (!raceState) { toast('No race data'); return; }
  const lanes  = raceState.lanes  || {};
  const splits = raceState.splits || {};
  const results = [];
  Object.keys(lanes).forEach(lane => {
    const vals = Object.values(splits[lane]||{}).map(s=>s.elapsedMs).filter(Boolean);
    const mean = vals.length ? trimmedMean(vals) : null;
    if (mean != null) results.push({ lane, name: lanes[lane]?.name || \`Lane \${lane}\`, timeMs: mean });
  });
  results.sort((a,b) => a.timeMs - b.timeMs);
  let place = 1;
  results.forEach(r => { r.place = place++; });

  const medals = ['\u{1F947}','\u{1F948}','\u{1F949}'];
  const rows   = results.map(r =>
    \`<tr><td style="text-align:center;font-size:1.4rem">\${medals[r.place-1]||r.place}</td><td>\${r.lane}</td><td style="font-weight:600">\${r.name}</td><td style="font-family:monospace;font-size:1.1rem">\${fmtSec(r.timeMs)}</td></tr>\`
  ).join('');

  const win = window.open('','_blank');
  win.document.write(\`<!DOCTYPE html><html><head><title>Results</title>
  <style>body{font-family:sans-serif;padding:32px;max-width:600px;margin:auto}h1{font-size:1.4rem;margin-bottom:4px}h2{font-size:1rem;color:#666;margin-bottom:24px;font-weight:400}table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:2px solid #ddd;padding:8px 12px;font-size:.85rem;text-transform:uppercase;color:#888}td{padding:10px 12px;border-bottom:1px solid #eee}@media print{button{display:none}}</style>
  </head><body>
  <h1>\${raceState.event||'Race Results'}</h1>
  <h2>\${raceState.age||''} \${raceState.gender||''} &mdash; \${new Date().toLocaleDateString('en-AU')}</h2>
  <table><thead><tr><th>Place</th><th>Lane</th><th>Athlete</th><th>Time</th></tr></thead><tbody>\${rows}</tbody></table>
  <p style="margin-top:32px;font-size:.75rem;color:#aaa">Generated by Carnival Timing &mdash; carnivaltiming.com</p>
  <button onclick="window.print()" style="margin-top:16px;padding:10px 24px;font-size:1rem;cursor:pointer">\u{1F5A8} Print</button>
  
<div id="ct-footer" style="position:fixed;bottom:0;left:0;right:0;background:rgba(13,27,62,0.92);backdrop-filter:blur(6px);color:rgba(255,255,255,0.5);font-size:11px;text-align:center;padding:6px 16px;z-index:100;display:flex;justify-content:center;gap:16px;align-items:center;flex-wrap:wrap;">
  <span>\xA9 2026 Luck Dragon Pty Ltd</span>
  <span>\xB7</span>
  <a href="/privacy" style="color:rgba(255,255,255,0.5);text-decoration:none;" target="_blank">Privacy</a>
  <span>\xB7</span>
  <a href="https://schoolsportportal.com.au" style="color:rgba(255,255,255,0.5);text-decoration:none;" target="_blank">School Sport Portal</a>
</div>
</body></html>\`);
  win.document.close();
}

// Attach lane-name autoload after DOM is ready
setTimeout(_attachLaneNameAutoLoad, 1500);

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  CT v8.5.1 \u2014 Auto Finish Line Detection
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
let xcAutoDetectMode = false;
let xcAutoPlaceCounter = 0; // local counter, incremented immediately to avoid race
let _xcResizeListener = null; // FIX 3: track resize listener for cleanup
let xcLineP1         = null;   // {x,y} normalised 0-1
let xcLineP2         = null;
let xcPrevSamples    = null;
let xcDetectInterval = null;
let xcLastTrigger    = 0;
let xcDiffThreshold  = 22;     // controlled by sensitivity slider
const XC_COOLDOWN_MS = 2800;   // min ms between auto-detections
const XC_SAMPLES     = 80;     // pixels sampled along finish line

// \u2500\u2500 Mode toggle \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function xcStartAutoMode() {
  xcAutoDetectMode = true;
  document.getElementById('marshal-tap-btn').style.display    = 'none';
  document.getElementById('xc-auto-mode-btn').style.display   = 'none';
  document.getElementById('xc-auto-bar').style.display        = 'flex';
  document.getElementById('xc-detect-status').textContent     = 'Draw your finish line to begin';
  xcInitCamera().then(() => {
    if (!xcCamStream) {
      // Camera denied \u2014 show message but still allow manual tap fallback
      toast('Camera access denied \u2014 auto-detect requires camera permission');
      xcStopAutoMode();
      return;
    }
    xcShowLineSetup();
  });
}

function xcStopAutoMode() {
  xcAutoDetectMode = false;
  xcStopDetect();
  if (_xcResizeListener) { window.removeEventListener('resize', _xcResizeListener); _xcResizeListener = null; } // FIX 3
  document.getElementById('marshal-tap-btn').style.display    = '';
  document.getElementById('xc-auto-mode-btn').style.display   = '';
  document.getElementById('xc-auto-bar').style.display        = 'none';
  document.getElementById('xc-line-setup-overlay').style.display = 'none';
}

// \u2500\u2500 Line setup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function xcShowLineSetup() {
  const overlay = document.getElementById('xc-line-setup-overlay');
  overlay.style.display = 'flex';
  xcLineP1 = null; xcLineP2 = null;
  document.getElementById('xc-start-detect-btn').style.display = 'none';
  document.getElementById('xc-line-instruction').textContent   = 'Tap the LEFT edge of your finish line';

  // Wire up the camera stream to the setup video
  const vid = document.getElementById('xc-setup-vid');
  if (xcCamStream) { vid.srcObject = xcCamStream; vid.play().catch(()=>{}); }

  // Resize canvas to match overlay \u2014 FIX 3: remove old listener before adding
  const canvas = document.getElementById('xc-line-canvas-overlay');
  if (_xcResizeListener) window.removeEventListener('resize', _xcResizeListener);
  _xcResizeListener = () => { canvas.width = overlay.clientWidth; canvas.height = overlay.clientHeight; xcDrawLine(); };
  _xcResizeListener();
  window.addEventListener('resize', _xcResizeListener);

  // Tap handler on the canvas
  canvas.ontouchstart = (e) => { e.preventDefault(); xcLineSetupTap(e.touches[0], canvas); };
  canvas.onmousedown  = (e) => xcLineSetupTap(e, canvas);
}

function xcCloseLineSetup() {
  document.getElementById('xc-line-setup-overlay').style.display = 'none';
  if (!xcDetectInterval) document.getElementById('xc-detect-status').textContent = 'Draw your finish line to begin';
}

function xcLineSetupTap(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top)  / rect.height;

  if (!xcLineP1) {
    xcLineP1 = {x, y};
    document.getElementById('xc-line-instruction').textContent = 'Now tap the RIGHT edge';
  } else if (!xcLineP2) {
    xcLineP2 = {x, y};
    document.getElementById('xc-line-instruction').textContent = '\u2705 Line set \u2014 ready to detect';
    document.getElementById('xc-start-detect-btn').style.display = '';
  }
  xcDrawLine();
}

function xcResetLine() {
  xcLineP1 = xcLineP2 = null;
  document.getElementById('xc-start-detect-btn').style.display = 'none';
  document.getElementById('xc-line-instruction').textContent   = 'Tap the LEFT edge of your finish line';
  xcDrawLine();
}

function xcDrawLine() {
  const canvas = document.getElementById('xc-line-canvas-overlay');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width, H = canvas.height;

  if (xcLineP1) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(xcLineP1.x * W, xcLineP1.y * H, 14, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', xcLineP1.x * W, xcLineP1.y * H + 4);
  }
  if (xcLineP2) {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(xcLineP2.x * W, xcLineP2.y * H, 14, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R', xcLineP2.x * W, xcLineP2.y * H + 4);
  }
  if (xcLineP1 && xcLineP2) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth   = 4;
    ctx.setLineDash([14, 7]);
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(xcLineP1.x * W, xcLineP1.y * H);
    ctx.lineTo(xcLineP2.x * W, xcLineP2.y * H);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  }
}

// \u2500\u2500 Detection loop \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function xcStartDetect() {
  if (!xcLineP1 || !xcLineP2) return;
  xcCloseLineSetup();
  xcPrevSamples    = null;
  xcLastTrigger    = 0;
  // FIX 4: sync local counter with current Firebase finish count before starting
  xcAutoPlaceCounter = Object.keys(xcState?.finishes || {}).length;
  document.getElementById('xc-detect-status').textContent = '\u{1F534} Detecting \u2014 runners auto-recorded';
  xcDetectInterval = setInterval(xcAnalyseFrame, 110); // ~9 fps
}

function xcStopDetect() {
  clearInterval(xcDetectInterval);
  xcDetectInterval = null;
  xcPrevSamples    = null;
}

// Offscreen canvas for detection \u2014 never touches xc-cap
let _xcDetectCanvas = null;

function xcAnalyseFrame() {
  if (!xcCamStream) return;
  if (!xcLineP1 || !xcLineP2) return; // FIX 6: guard null line points
  const video = document.getElementById('xc-cam');
  if (!video || video.readyState < 2) return;

  if (!_xcDetectCanvas) {
    _xcDetectCanvas = document.createElement('canvas');
    _xcDetectCanvas.width = 320; _xcDetectCanvas.height = 240;
  }
  const W = 320, H = 240;
  const ctx = _xcDetectCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0, W, H);

  const imgData = ctx.getImageData(0, 0, W, H);
  const samples = xcSampleLine(imgData, xcLineP1, xcLineP2, XC_SAMPLES);

  if (xcPrevSamples) {
    const diff = xcLineDiff(samples, xcPrevSamples);
    const now  = Date.now();
    if (diff > xcDiffThreshold && (now - xcLastTrigger) > XC_COOLDOWN_MS) {
      xcLastTrigger = now;
      xcAutoFinish();
    }
  }
  xcPrevSamples = samples;
}

function xcSampleLine(imgData, p1, p2, n) {
  const { data, width, height } = imgData;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t  = i / (n - 1);
    const px = Math.min(width  - 1, Math.max(0, Math.round(p1.x * width  + t * (p2.x - p1.x) * width)));
    const py = Math.min(height - 1, Math.max(0, Math.round(p1.y * height + t * (p2.y - p1.y) * height)));
    const idx = (py * width + px) * 4;
    out.push((data[idx] + data[idx+1] + data[idx+2]) / 3);
  }
  return out;
}

function xcLineDiff(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}

// \u2500\u2500 Auto-trigger a finish \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function xcAutoFinish() {
  if (!xcState || xcState.state !== 'live') return;

  const elapsed = nowServer() - xcState.startedAtServer;
  // FIX 4: increment local counter immediately \u2014 don't read Firebase state
  // (Firebase snapshot may lag, causing two fast finishes to get the same place)
  xcAutoPlaceCounter++;
  const place = xcAutoPlaceCounter;

  // Audio + haptic feedback
  xcDetectBeep();
  vibrate([80, 40, 80]);

  const key = myId.slice(0, 4) + '-' + Date.now().toString(36);
  xcCapturePhoto(key); // burst capture

  // Write to Firebase (same structure as marshalTap)
  await cRef(\`xc/current/finishes/\${key}\`).set({
    marshalId:   myId,
    marshalName: myName || 'Auto',
    bib:         '',
    name:        '',
    elapsedMs:   elapsed,
    tapAt:       firebase.database.ServerValue.TIMESTAMP,
    autoDetected: true,
  });

  document.getElementById('xc-detect-status').textContent = \`\u26A1 #\${place} detected \u2014 \${fmtMs(elapsed)}\`;
  setTimeout(() => {
    if (xcDetectInterval) document.getElementById('xc-detect-status').textContent = '\u{1F534} Detecting \u2014 runners auto-recorded';
  }, 2000);

  // Queue bib entry \u2014 but try OCR first with auto-confirm
  bibPendingQueue.push({ key, place, elapsed, autoDetected: true });
  if (!bibPendingKey) showNextBib();
}

function xcDetectBeep() {
  try {
    const ac  = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g); g.connect(ac.destination);
    osc.frequency.value = 920;
    osc.type = 'sine';
    g.gain.setValueAtTime(0.35, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
    osc.start(); osc.stop(ac.currentTime + 0.25);
  } catch(e) {}
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
//  CT v8.8 \u2014 Option B: In-App Video Recorder
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
let _xcMediaRecorder    = null;
let _xcRecChunks        = [];
let _xcRecStartTime     = 0;
let _xcRecTimerInterval = null;

function xcToggleRecord() {
  if (_xcMediaRecorder && _xcMediaRecorder.state === 'recording') {
    xcStopRecording();
  } else {
    xcStartRecording();
  }
}

async function xcStartRecording() {
  // Ensure camera is running
  if (!xcCamStream) {
    await xcInitCamera();
    if (!xcCamStream) { toast('Camera not available \u2014 grant permission first'); return; }
  }
  if (typeof MediaRecorder === 'undefined') { toast('Video recording not supported on this browser'); return; }
  try {
    const mimeType = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4']
      .find(t => MediaRecorder.isTypeSupported(t)) || '';
    _xcRecChunks = [];
    _xcMediaRecorder = new MediaRecorder(xcCamStream, mimeType ? { mimeType } : {});
    _xcMediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) _xcRecChunks.push(e.data); };
    _xcMediaRecorder.onstop = xcSaveRecording;
    _xcMediaRecorder.start(1000); // flush chunk every 1 s so data isn't lost if tab closes
    _xcRecStartTime = Date.now();

    // Update UI
    const btn = document.getElementById('xc-rec-btn');
    if (btn) { btn.textContent = '\u{1F534}'; btn.style.borderColor = '#ef4444'; btn.style.color = '#ef4444'; }
    const bar = document.getElementById('xc-rec-bar');
    if (bar) bar.style.display = 'flex';

    _xcRecTimerInterval = setInterval(() => {
      const secs = Math.floor((Date.now() - _xcRecStartTime) / 1000);
      const mm = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss = String(secs % 60).padStart(2, '0');
      const el = document.getElementById('xc-rec-status');
      if (el) el.textContent = '\u25CF REC ' + mm + ':' + ss;
    }, 1000);

    toast('\u{1F4F9} Recording started');
  } catch(e) {
    toast('Recording failed: ' + (e.message || e));
    _xcMediaRecorder = null;
  }
}

function xcStopRecording() {
  if (!_xcMediaRecorder || _xcMediaRecorder.state === 'inactive') return;
  try { _xcMediaRecorder.stop(); } catch(e) {}
  clearInterval(_xcRecTimerInterval);
  _xcRecTimerInterval = null;
  const btn = document.getElementById('xc-rec-btn');
  if (btn) { btn.textContent = '\u{1F4F9}'; btn.style.borderColor = ''; btn.style.color = ''; }
  const bar = document.getElementById('xc-rec-bar');
  if (bar) bar.style.display = 'none';
  toast('Saving video\u2026');
}

function xcSaveRecording() {
  if (!_xcRecChunks.length) { toast('No video captured'); return; }
  const mimeType = (_xcMediaRecorder && _xcMediaRecorder.mimeType) || 'video/webm';
  const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const blob = new Blob(_xcRecChunks, { type: mimeType });
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const name = 'ct-recording-' + ts + '.' + ext;
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  toast('\u2705 Saved: ' + name);
  _xcRecChunks = []; _xcMediaRecorder = null;
}



// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// URL AUTO-CREATE (deep-link from sportcarnival.com.au)
// Usage: carnivaltiming.com?school=X&event=Y&sport=track&houses=Red,Blue&colour=%2314b8a6&code=WPS-2026
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
async function checkAutoCreate() {
  const params = new URLSearchParams(window.location.search);
  const school = params.get('school');
  const event  = params.get('event');
  if (!school || !event) return;

  const sport      = params.get('sport')   || 'track';
  const tier       = params.get('tier')    || 'school';
  const colour     = params.get('colour')  || '#14b8a6';
  const housesRaw  = params.get('houses')  || '';
  const houses     = housesRaw ? housesRaw.split(',').map(h => h.trim()).filter(Boolean) : [];
  const accessCode = params.get('code');

  // Apply sport/tier globals so admin panel shows correct sport
  selSport = sport;
  selTier  = tier;

  // Store access code for any future paywall checks
  if (accessCode) localStorage.setItem('ct_access_v1', accessCode);

  // Show home screen briefly then auto-create
  showScreen('home');
  applyAccent(colour);
  toast('Setting up carnival\u2026', 3000);
  await new Promise(r => setTimeout(r, 900));

  // Find a unique 4-letter code
  let cCode, snap;
  do {
    cCode = genCode();
    carnivalCode = cCode; await _wsReady2(); snap = await db.ref('meta').once('value');
  } while (snap.exists());

  carnivalCode = cCode;
  carnivalMeta = {
    school, name: event, sport, tier, colour,
    houses, program: [],
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };
  await db.ref('meta').set(carnivalMeta);
  localStorage.setItem('fl_last_code', cCode);
  toast(\`Carnival ready \u2014 \${cCode}\`, 3500);
  showRolePicker();
  setTimeout(() => enterRole('admin'), 700);
}

// Run URL auto-create after Firebase/app has initialised
setTimeout(checkAutoCreate, 1200);

// STAFF QR DEEP LINK — #j=ABCD&p=1234
window._stagedStaffPin = null;
async function checkStaffDeepLink() {
  const h = (window.location.hash || '').replace(/^#/, '');
  if (!h) return;
  const params = new URLSearchParams(h);
  const code = (params.get('j') || '').toUpperCase();
  const pin  = params.get('p') || '';
  if (!code || !pin) return;
  // Strip hash so PIN does not linger in URL bar / Referer
  try { history.replaceState({}, '', location.pathname + location.search); } catch(_) {}
  window._stagedStaffPin = String(pin);
  await new Promise(r => setTimeout(r, 800));
  const codeInput = document.getElementById('join-code-input');
  if (codeInput) codeInput.value = code;
  showScreen('join-screen');
  toast('Scan ok — enter your name', 3500);
}
setTimeout(checkStaffDeepLink, 1400);

<\/script>
`;
var PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy \u2014 Luck Dragon</title>
<meta name="robots" content="index, follow">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;line-height:1.7}
a{color:#1a56db;text-decoration:none}a:hover{text-decoration:underline}
.hero{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a6e 60%,#1a56db 100%);color:#fff;padding:56px 24px 72px;text-align:center;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:36px;background:#f8fafc;clip-path:ellipse(55% 100% at 50% 100%)}
.badge{display:inline-block;background:rgba(245,158,11,.18);border:1px solid rgba(245,158,11,.4);color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 14px;border-radius:20px;margin-bottom:14px}
.hero h1{font-size:clamp(26px,5vw,40px);font-weight:900;letter-spacing:-.02em;margin-bottom:10px}
.hero p{font-size:14px;opacity:.78;max-width:520px;margin:0 auto}
.container{max-width:760px;margin:0 auto;padding:48px 24px 80px}
.section{margin-bottom:40px}
h2{font-size:18px;font-weight:800;color:#0d1b3e;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
h3{font-size:14px;font-weight:700;color:#0f172a;margin:18px 0 6px}
p{font-size:14px;color:#334155;margin-bottom:10px}
ul{font-size:14px;color:#334155;padding-left:20px;margin-bottom:10px}
ul li{margin-bottom:5px}
.card{background:#fff;border-radius:14px;padding:22px 26px;box-shadow:0 2px 10px rgba(0,0,0,.07);margin-bottom:16px}
.highlight{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 18px;font-size:13px;color:#1e40af;margin:16px 0}
.products{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:12px 0}
.product{background:#f1f5f9;border-radius:10px;padding:14px 16px}
.product .name{font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px}
.product .desc{font-size:12px;color:#64748b}
.updated{font-size:12px;color:#94a3b8;margin-bottom:32px}
footer{background:#0d1b3e;color:rgba(255,255,255,.5);text-align:center;padding:24px;font-size:12px}
footer a{color:rgba(255,255,255,.7)}
</style>
</head>
<body>
<div class="hero">
  <div class="badge">Legal</div>
  <h1>Privacy Policy</h1>
  <p>How Luck Dragon collects, uses, and protects your information across all our school sport products.</p>
</div>
<div class="container">
  <p class="updated">Last updated: 1 May 2026 &nbsp;\xB7&nbsp; Luck Dragon Pty Ltd (ABN 64 697 434 898)</p>

  <div class="highlight">
    <strong>The short version:</strong> We collect only what we need to run school sport. Student data is stored securely in Australia and never sold, shared with advertisers, or used for any purpose outside school sport coordination.
  </div>

  <div class="section">
    <h2>1. Who We Are</h2>
    <div class="card">
      <p>Luck Dragon Pty Ltd (ABN 64 697 434 898) operates three school sport products:</p>
      <div class="products">
        <div class="product"><div class="name">School Sport Portal</div><div class="desc">schoolsportportal.com.au \u2014 school, district &amp; division portals</div></div>
        <div class="product"><div class="name">Carnival Timing</div><div class="desc">carnivaltiming.com \u2014 live race timing for carnivals</div></div>
        <div class="product"><div class="name">SportCarnival</div><div class="desc">sportcarnival.com.au \u2014 carnival results and draw management</div></div>
      </div>
      <p>This Privacy Policy applies to all three products. For questions, contact us at <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a>.</p>
    </div>
  </div>

  <div class="section">
    <h2>2. What Data We Collect</h2>
    <div class="card">
      <h3>Student Performance Data (Carnival Timing &amp; School Sport Portal)</h3>
      <p>When a school coordinator uses our timing tools, we store:</p>
      <ul>
        <li>First name and last initial (never full surnames publicly)</li>
        <li>Age group and gender category</li>
        <li>Race/event times and placing</li>
        <li>School name and district</li>
        <li>House group (where entered)</li>
      </ul>
      <p>Full names are only visible to signed-in coordinators. Public result views show first name + last initial + school only.</p>

      <h3>Coordinator Account Data</h3>
      <ul>
        <li>Email address (for account access and notifications)</li>
        <li>School name and role</li>
        <li>Access code and subscription status (Carnival Timing)</li>
      </ul>

      <h3>Contact Form Submissions (School Sport Portal)</h3>
      <ul>
        <li>Name, email address, school, and message content</li>
        <li>Used only to respond to your enquiry</li>
      </ul>

      <h3>Technical Data</h3>
      <ul>
        <li>Browser type and device (Cloudflare analytics only \u2014 no cookies placed)</li>
        <li>Pages visited and time on site (aggregate, not individual tracking)</li>
        <li>IP address (retained by Cloudflare per their standard policy, not accessed by us)</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>3. How We Use Your Data</h2>
    <div class="card">
      <p>We use data only for the following purposes:</p>
      <ul>
        <li><strong>Displaying carnival results</strong> \u2014 showing times and placings to school staff and parents</li>
        <li><strong>Selecting representative teams</strong> \u2014 surfacing top performers at district, division and region level</li>
        <li><strong>Account management</strong> \u2014 validating access codes and processing subscriptions</li>
        <li><strong>Responding to enquiries</strong> \u2014 replying to contact form submissions</li>
        <li><strong>Improving our products</strong> \u2014 fixing bugs, improving reliability, adding features</li>
      </ul>
      <p>We do <strong>not</strong> use data for advertising, profiling, or any purpose unrelated to school sport.</p>
    </div>
  </div>

  <div class="section">
    <h2>4. Data Storage &amp; Security</h2>
    <div class="card">
      <p>All data is stored in Australia using the following services:</p>
      <ul>
        <li><strong>Cloudflare Workers &amp; KV</strong> \u2014 edge infrastructure with Australian data residency</li>
        <li><strong>Cloudflare Workers WebSocket</strong> \u2014 Cloudflare global edge (Australian PoPs)</li>
      </ul>
      <p>Access to student data requires coordinator authentication. Public-facing result pages display only anonymised data (first name + last initial). We use HTTPS across all services. No passwords are stored \u2014 access is managed via Cloudflare Access and single-use codes.</p>
    </div>
  </div>

  <div class="section">
    <h2>5. Data Retention</h2>
    <div class="card">
      <p>Carnival result data is retained for a maximum of 3 years to support historical team selection records. Contact form submissions are retained for 12 months. You may request deletion of any data we hold about your school at any time by emailing <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a>.</p>
    </div>
  </div>

  <div class="section">
    <h2>6. Sharing of Data</h2>
    <div class="card">
      <p>We do not sell, rent, or share personal data with third parties, except:</p>
      <ul>
        <li><strong>Stripe</strong> \u2014 payment processing for Carnival Timing subscriptions. Stripe handles card data directly; we never see or store payment card numbers.</li>
        <li><strong>Resend</strong> \u2014 transactional email delivery for contact form replies and access code emails.</li>
        <li><strong>Cloudflare</strong> \u2014 infrastructure provider. Cloudflare processes request data per their own Privacy Policy.</li>
      </ul>
      <p>All third-party providers are bound by data processing agreements and applicable privacy law.</p>
    </div>
  </div>

  <div class="section">
    <h2>7. Australian Privacy Act Compliance</h2>
    <div class="card">
      <p>Luck Dragon Pty Ltd is committed to compliance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs). In particular:</p>
      <ul>
        <li><strong>APP 1</strong> \u2014 This policy is publicly available and describes our data practices</li>
        <li><strong>APP 3</strong> \u2014 We collect only information reasonably necessary for our school sport functions</li>
        <li><strong>APP 6</strong> \u2014 Data is used only for the primary purpose of collection</li>
        <li><strong>APP 8</strong> \u2014 Cross-border disclosures are limited to service providers with equivalent protections</li>
        <li><strong>APP 11</strong> \u2014 We take reasonable steps to protect data from misuse, loss, and unauthorised access</li>
        <li><strong>APP 12/13</strong> \u2014 Individuals and schools may access and correct data held about them on request</li>
      </ul>
      <p>As our products are used in Victorian government school settings, we also have regard to the <em>Privacy and Data Protection Act 2014</em> (Vic) and Department of Education guidelines for school data management.</p>
    </div>
  </div>

  <div class="section">
    <h2>8. Children's Privacy</h2>
    <div class="card">
      <p>Our products are designed for use by school sport coordinators and PE teachers, not directly by children. Students do not create accounts or directly interact with our platforms. Student data is entered by authorised school staff only. Public result views are limited to non-identifying information (first name, last initial, school, time).</p>
      <p>Schools are responsible for obtaining any required parental consents in accordance with their own privacy policies and department requirements before entering student data.</p>
    </div>
  </div>

  <div class="section">
    <h2>9. Your Rights</h2>
    <div class="card">
      <p>You (or your school) may at any time:</p>
      <ul>
        <li>Request a copy of data we hold about your school</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your school's data</li>
        <li>Opt out of any communications from us</li>
      </ul>
      <p>To exercise any of these rights, email <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a>. We will respond within 30 days.</p>
    </div>
  </div>

  <div class="section">
    <h2>10. Changes to This Policy</h2>
    <div class="card">
      <p>We may update this Privacy Policy from time to time. Material changes will be notified to active subscribers by email. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of our products after changes constitutes acceptance of the updated policy.</p>
    </div>
  </div>

  <div class="section">
    <h2>11. Contact &amp; Complaints</h2>
    <div class="card">
      <p>For privacy enquiries or complaints:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a></li>
        <li><strong>Company:</strong> Luck Dragon Pty Ltd, ABN 64 697 434 898</li>
        <li><strong>Location:</strong> Victoria, Australia</li>
      </ul>
      <p>If you are not satisfied with our response to a complaint, you may contact the <a href="https://www.oaic.gov.au" target="_blank" rel="noopener">Office of the Australian Information Commissioner (OAIC)</a>.</p>
    </div>
  </div>
</div>
<footer>
  &copy; 2026 Luck Dragon Pty Ltd &nbsp;&middot;&nbsp; ABN 64 697 434 898 &nbsp;&middot;&nbsp;
  <a href="/privacy">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="/terms">Terms of Service</a> &nbsp;&middot;&nbsp;
  <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a>
</footer>
</body>
</html>`;
var TERMS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Terms of Service \u2014 Luck Dragon</title>
<meta name="robots" content="index, follow">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;line-height:1.7}
a{color:#1a56db;text-decoration:none}a:hover{text-decoration:underline}
.hero{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a6e 60%,#1a56db 100%);color:#fff;padding:56px 24px 72px;text-align:center;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:36px;background:#f8fafc;clip-path:ellipse(55% 100% at 50% 100%)}
.badge{display:inline-block;background:rgba(245,158,11,.18);border:1px solid rgba(245,158,11,.4);color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 14px;border-radius:20px;margin-bottom:14px}
.hero h1{font-size:clamp(26px,5vw,40px);font-weight:900;letter-spacing:-.02em;margin-bottom:10px}
.hero p{font-size:14px;opacity:.78;max-width:520px;margin:0 auto}
.container{max-width:760px;margin:0 auto;padding:48px 24px 80px}
.section{margin-bottom:40px}
h2{font-size:18px;font-weight:800;color:#0d1b3e;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
h3{font-size:14px;font-weight:700;color:#0f172a;margin:18px 0 6px}
p{font-size:14px;color:#334155;margin-bottom:10px}
ul{font-size:14px;color:#334155;padding-left:20px;margin-bottom:10px}
ul li{margin-bottom:5px}
.card{background:#fff;border-radius:14px;padding:22px 26px;box-shadow:0 2px 10px rgba(0,0,0,.07);margin-bottom:16px}
.highlight{background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px 18px;font-size:13px;color:#92400e;margin:16px 0}
.pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:12px 0}
.price-card{background:#f1f5f9;border-radius:10px;padding:16px;text-align:center}
.price-card .plan{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px}
.price-card .amount{font-size:24px;font-weight:900;color:#0d1b3e}
.price-card .period{font-size:11px;color:#94a3b8;margin-top:2px}
.updated{font-size:12px;color:#94a3b8;margin-bottom:32px}
footer{background:#0d1b3e;color:rgba(255,255,255,.5);text-align:center;padding:24px;font-size:12px}
footer a{color:rgba(255,255,255,.7)}
</style>
</head>
<body>
<div class="hero">
  <div class="badge">Legal</div>
  <h1>Terms of Service</h1>
  <p>The terms that govern your use of School Sport Portal, Carnival Timing, and SportCarnival.</p>
</div>
<div class="container">
  <p class="updated">Last updated: 1 May 2026 &nbsp;\xB7&nbsp; Luck Dragon Pty Ltd (ABN 64 697 434 898)</p>

  <div class="highlight">
    By using any Luck Dragon product, you agree to these terms. If you are using our products on behalf of a school, you confirm you have authority to bind the school to these terms.
  </div>

  <div class="section">
    <h2>1. Our Products</h2>
    <div class="card">
      <p>Luck Dragon Pty Ltd (ABN 64 697 434 898) provides three school sport software products:</p>
      <ul>
        <li><strong>School Sport Portal</strong> (schoolsportportal.com.au) \u2014 school, district, and division sport information portals for Australian primary schools</li>
        <li><strong>Carnival Timing</strong> (carnivaltiming.com) \u2014 real-time race timing and results management for school athletics, swimming, and cross country carnivals</li>
        <li><strong>SportCarnival</strong> (sportcarnival.com.au) \u2014 carnival draw and results management tools</li>
      </ul>
      <p>These Terms of Service apply to all three products and any associated services.</p>
    </div>
  </div>

  <div class="section">
    <h2>2. Eligibility &amp; Account Access</h2>
    <div class="card">
      <p>Our products are intended for use by:</p>
      <ul>
        <li>PE teachers, sport coordinators, and school administrators at Australian primary and secondary schools</li>
        <li>District, division, and regional sport coordinators</li>
        <li>Parents and community members viewing published results (read-only)</li>
      </ul>
      <p>You must be 18 years or older to create an account or purchase a subscription. Students do not create accounts and do not directly use our platforms \u2014 all student data is entered by authorised school staff.</p>
    </div>
  </div>

  <div class="section">
    <h2>3. Carnival Timing \u2014 Pricing &amp; Subscriptions</h2>
    <div class="card">
      <p>Carnival Timing is a paid product. Current pricing:</p>
      <div class="pricing">
        <div class="price-card"><div class="plan">Per Carnival</div><div class="amount">$49</div><div class="period">One-time, per event</div></div>
        <div class="price-card"><div class="plan">Annual</div><div class="amount">$149</div><div class="period">Per year, unlimited carnivals</div></div>
      </div>
      <h3>Payment</h3>
      <p>Payments are processed securely by Stripe. We do not store card details. All prices are in AUD and include GST where applicable.</p>
      <h3>Access Codes</h3>
      <p>On successful payment, you receive an access code by email. This code is linked to your school and grants access to the Carnival Timing app for the purchased period. Access codes are non-transferable.</p>
      <h3>Refunds</h3>
      <p>Per-carnival purchases ($49): if you experience a technical failure that prevents you from running your carnival and we are unable to resolve it, we will issue a full refund. Change-of-mind refunds are not available once an access code has been used to enter athlete data.</p>
      <p>Annual subscriptions ($149): a full refund is available within 14 days of purchase if no carnival data has been entered. After 14 days or after use, no refund is available.</p>
      <p>To request a refund, email <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a> with your access code and reason.</p>
    </div>
  </div>

  <div class="section">
    <h2>4. School Sport Portal \u2014 Pricing</h2>
    <div class="card">
      <p>School Sport Portal is priced at <strong>$1 per student per year</strong> for schools with a managed portal. District and division portals are priced separately \u2014 contact us for a quote. A free demo portal is available at <a href="https://schoolsportportal.com.au/demo-school">schoolsportportal.com.au/demo-school</a>.</p>
      <p>SportCarnival is currently free to use. Future paid features will be announced with at least 30 days notice to existing users.</p>
    </div>
  </div>

  <div class="section">
    <h2>5. Acceptable Use</h2>
    <div class="card">
      <p>You agree not to:</p>
      <ul>
        <li>Enter false or fabricated student data, results, or times</li>
        <li>Share access codes with schools or individuals not covered by your subscription</li>
        <li>Attempt to reverse-engineer, copy, or reproduce our software or designs</li>
        <li>Use our products for any purpose other than legitimate school sport coordination</li>
        <li>Scrape, bulk-download, or systematically extract data from our platforms</li>
        <li>Attempt to access accounts or data belonging to other schools</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>6. Student Data Responsibility</h2>
    <div class="card">
      <p>Schools are responsible for:</p>
      <ul>
        <li>Ensuring they have appropriate authority to enter student data into our systems</li>
        <li>Complying with their own school and departmental privacy policies when using our products</li>
        <li>Notifying us promptly if student data needs to be corrected or removed</li>
        <li>Keeping their access credentials secure</li>
      </ul>
      <p>We act as a data processor on behalf of schools for student performance data. Schools remain the data controller under the <em>Privacy Act 1988</em> (Cth) and relevant state legislation.</p>
    </div>
  </div>

  <div class="section">
    <h2>7. Accuracy of Results</h2>
    <div class="card">
      <p>Carnival Timing is a software tool designed to assist with manual race timing. We make no guarantee that recorded times are officially accurate for purposes beyond school sport carnivals. Results recorded by our system should be verified by a qualified official before being used for any formal selection, record-keeping, or competitive purpose beyond the school carnival level.</p>
      <p>Luck Dragon Pty Ltd accepts no liability for decisions made by schools, districts, divisions, or regions based on timing data recorded using our products.</p>
    </div>
  </div>

  <div class="section">
    <h2>8. Service Availability</h2>
    <div class="card">
      <p>We aim for high availability but do not guarantee uninterrupted access. Our products run on Cloudflare's global network, which has strong uptime guarantees, but maintenance, updates, or unexpected outages may occur. We are not liable for losses arising from service unavailability.</p>
      <p>If a paid service is unavailable on the day of your carnival due to our error, we will provide a refund as described in Section 3.</p>
    </div>
  </div>

  <div class="section">
    <h2>9. Intellectual Property</h2>
    <div class="card">
      <p>All software, designs, text, and branding on our platforms are owned by Luck Dragon Pty Ltd. You may not copy, reproduce, or create derivative works from any part of our products without prior written consent. Student performance data entered by schools remains the property of the relevant school.</p>
    </div>
  </div>

  <div class="section">
    <h2>10. Limitation of Liability</h2>
    <div class="card">
      <p>To the maximum extent permitted by Australian law, Luck Dragon Pty Ltd's total liability to you for any claim arising from your use of our products is limited to the amount you paid us in the 12 months preceding the claim (or $100 if you have not paid us anything).</p>
      <p>We are not liable for indirect, incidental, or consequential losses including lost data, missed carnival events, or decisions made based on our results.</p>
      <p>Nothing in these terms excludes rights you have under Australian consumer law that cannot be excluded by contract.</p>
    </div>
  </div>

  <div class="section">
    <h2>11. Governing Law</h2>
    <div class="card">
      <p>These Terms of Service are governed by the laws of Victoria, Australia. Any disputes will be subject to the non-exclusive jurisdiction of the courts of Victoria.</p>
    </div>
  </div>

  <div class="section">
    <h2>12. Changes to These Terms</h2>
    <div class="card">
      <p>We may update these terms from time to time. Active subscribers will be notified of material changes by email at least 14 days before they take effect. Continued use of our products after that date constitutes acceptance of the updated terms.</p>
    </div>
  </div>

  <div class="section">
    <h2>13. Contact</h2>
    <div class="card">
      <ul>
        <li><strong>Email:</strong> <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a></li>
        <li><strong>Company:</strong> Luck Dragon Pty Ltd</li>
        <li><strong>ABN:</strong> 64 697 434 898</li>
        <li><strong>Location:</strong> Victoria, Australia</li>
      </ul>
    </div>
  </div>
</div>
<footer>
  &copy; 2026 Luck Dragon Pty Ltd &nbsp;&middot;&nbsp; ABN 64 697 434 898 &nbsp;&middot;&nbsp;
  <a href="/privacy">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="/terms">Terms of Service</a> &nbsp;&middot;&nbsp;
  <a href="mailto:info@schoolsportportal.com.au">info@schoolsportportal.com.au</a>
</footer>
</body>
</html>`;
// Event timing page generator — reads from carnival-results D1 API.
// v4 (2026-05-12): switched from direct Firebase to D1-backed REST API per FIREBASE_DECOMMISSION plan.
//
// API endpoints (CORS-open, GET-only):
//   GET https://sportcarnival.com.au/api/list                  -> [{code, school, sport, name, published_at}]
//   GET https://sportcarnival.com.au/api/results?carnival=CODE -> {ok, meta:{school,sport,name}, results:{raceKey:{age,event,gender,raceId,publishedAt,results:[{lane,name,place,timeMs,house?,school?}],type}}}
//
// Each event page polls /api/list every 30s and /api/results?carnival=CODE every 5s while visible.

const _CT_EVENT_REGISTRY = {
  "wps-crosscountry-2026": {
    title: "WPS Cross Country 2026 — Live Results",
    subtitle: "Williamstown Primary School · Cross Country",
    school: "Williamstown Primary School",
    sportPattern: "xc|cross",
    schoolPattern: "williamstown primary",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/school/primary/williamstown",
    portalUrl: "https://schoolsportportal.com.au/school/primary/williamstown"
  },
  "wd-athletics-2026": {
    title: "Williamstown District Athletics 2026 — Live Results",
    subtitle: "Williamstown District · Athletics",
    school: "Williamstown District",
    sportPattern: "athletics|track",
    schoolPattern: "williamstown district",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/district/primary/williamstown",
    portalUrl: "https://schoolsportportal.com.au/district/primary/williamstown"
  },
  "wd-swimming-2026": {
    title: "Williamstown District Swimming 2026 — Live Results",
    subtitle: "Williamstown District · Swimming",
    school: "Williamstown District",
    sportPattern: "swim",
    schoolPattern: "williamstown district",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/district/primary/williamstown",
    portalUrl: "https://schoolsportportal.com.au/district/primary/williamstown"
  },
  "wmr-crosscountry-2026": {
    title: "Western Metro Region XC 2026 — Live Results",
    subtitle: "Western Metropolitan Region · Cross Country",
    school: "Western Metropolitan Region",
    sportPattern: "xc|cross",
    schoolPattern: "wmr|western metro",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/region/wmr",
    portalUrl: "https://schoolsportportal.com.au/region/wmr"
  },
  "wyndham-crosscountry-2026": {
    title: "Wyndham Division XC 2026 — Live Results",
    subtitle: "Wyndham Division · Cross Country",
    school: "Wyndham Division",
    sportPattern: "xc|cross",
    schoolPattern: "wyndham",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/division/primary/wyndham",
    portalUrl: "https://schoolsportportal.com.au/division/primary/wyndham"
  },
  "wyndham-athletics-2026": {
    title: "Wyndham Division Athletics 2026 — Live Results",
    subtitle: "Wyndham Division · Athletics",
    school: "Wyndham Division",
    sportPattern: "athletics|track",
    schoolPattern: "wyndham",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/division/primary/wyndham",
    portalUrl: "https://schoolsportportal.com.au/division/primary/wyndham"
  },
  "hobsonsbay-crosscountry-2026": {
    title: "Hobsons Bay Division XC 2026 — Live Results",
    subtitle: "Hobsons Bay Division · Cross Country",
    school: "Hobsons Bay Division",
    sportPattern: "xc|cross",
    schoolPattern: "hobsons bay",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/division/primary/hobsons-bay",
    portalUrl: "https://schoolsportportal.com.au/division/primary/hobsons-bay"
  },
  "hobsonsbay-athletics-2026": {
    title: "Hobsons Bay Division Athletics 2026 — Live Results",
    subtitle: "Hobsons Bay Division · Athletics",
    school: "Hobsons Bay Division",
    sportPattern: "athletics|track",
    schoolPattern: "hobsons bay",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/division/primary/hobsons-bay",
    portalUrl: "https://schoolsportportal.com.au/division/primary/hobsons-bay"
  },
  "wps-athletics-2026": {
    title: "WPS Athletics 2026 — Live Results",
    subtitle: "Williamstown Primary School · Athletics",
    school: "Williamstown Primary School",
    sportPattern: "athletics|track",
    schoolPattern: "williamstown primary",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/school/primary/williamstown",
    portalUrl: "https://schoolsportportal.com.au/school/primary/williamstown"
  },
  "wps-swimming-2026": {
    title: "WPS Swimming 2026 — Live Results",
    subtitle: "Williamstown Primary School · Swimming",
    school: "Williamstown Primary School",
    sportPattern: "swim",
    schoolPattern: "williamstown primary",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/school/primary/williamstown",
    portalUrl: "https://schoolsportportal.com.au/school/primary/williamstown"
  },
  "wd-crosscountry-2026": {
    title: "Williamstown District XC 2026 — Live Results",
    subtitle: "Williamstown District · Cross Country",
    school: "Williamstown District",
    sportPattern: "xc|cross",
    schoolPattern: "williamstown district",
    excludeDemo: true,
    appUrl: "https://schoolsportportal.com.au/district/primary/williamstown",
    portalUrl: "https://schoolsportportal.com.au/district/primary/williamstown"
  }
};

const _CT_API_BASE = "https://sportcarnival.com.au";

function _ctEventPage(slug) {
  const cfg = _CT_EVENT_REGISTRY[slug];
  if (!cfg) return null;
  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${cfg.title}</title>\n<link rel="canonical" href="https://carnivaltiming.com/${slug}">\n<meta name="description" content="${cfg.subtitle} — live results">\n<meta property="og:title" content="${cfg.title}">\n<meta property="og:description" content="${cfg.subtitle}">\n<meta property="og:url" content="https://carnivaltiming.com/${slug}">\n<meta property="og:type" content="article">\n<meta property="og:image" content="https://carnivaltiming.com/og-card.png">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="https://carnivaltiming.com/og-card.png">\n<meta name="theme-color" content="#0d1b3e">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#fff;min-height:100vh}
  .nav{background:linear-gradient(90deg,#0d1b3e,#1a3a6e);padding:10px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:13px;font-weight:600}
  .nav a{color:#fff;text-decoration:none;opacity:.92}
  .nav .brand{color:#fcd34d}
  .nav .pill{background:#dc2626;padding:5px 12px;border-radius:6px;font-size:12px;color:#fff;text-decoration:none}
  .container{max-width:1100px;margin:0 auto;padding:24px 18px}
  .header{margin-bottom:20px}
  .header h1{font-size:1.8rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px}
  .header .sub{color:#94a3b8;font-size:.95rem;margin-bottom:8px}
  .header .meta{color:#94a3b8;font-size:.85rem;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
  .meta .live{display:inline-flex;align-items:center;gap:6px;color:#22c55e;font-weight:600}
  .meta .live .dot{width:8px;height:8px;background:#22c55e;border-radius:50%;animation:pulse 1.5s infinite}
  .meta .live.off{color:#64748b}
  .meta .live.off .dot{background:#64748b;animation:none}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  .carnival-pick{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px}
  .carnival-pick label{font-size:.85rem;color:#94a3b8;align-self:center}
  .carnival-pick select{background:#0f172a;border:1px solid #334155;color:#fcd34d;padding:6px 10px;border-radius:6px;font-size:.85rem;font-family:inherit;font-weight:600;flex:1;min-width:200px}
  .filter{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
  .filter input,.filter select{background:#1e293b;border:1px solid #334155;color:#fff;padding:8px 12px;border-radius:6px;font-size:.9rem;font-family:inherit}
  .filter input{flex:1;min-width:200px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:18px}
  .stat{background:#1e293b;padding:14px;border-radius:8px;border:1px solid #334155}
  .stat .v{font-size:1.6rem;font-weight:800;color:#fcd34d}
  .stat .k{color:#94a3b8;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
  .events{display:flex;flex-direction:column;gap:12px}
  .event{background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden}
  .event h3{padding:12px 16px;background:#334155;font-size:.95rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
  .event h3 .tag{background:#0f172a;color:#fcd34d;font-size:.72rem;padding:3px 8px;border-radius:4px;font-weight:600}
  .event table{width:100%;border-collapse:collapse;font-size:.88rem}
  .event th,.event td{padding:8px 14px;text-align:left;border-bottom:1px solid #334155}
  .event tr:last-child td{border-bottom:none}
  .event td.place{font-weight:800;color:#fcd34d;width:50px;text-align:center}
  .event td.num{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:#22c55e}
  .event td.house,.event td.school{color:#94a3b8;font-size:.85rem}
  .empty{padding:60px 20px;text-align:center;color:#64748b;background:#1e293b;border-radius:10px;border:1px solid #334155}
  .empty p{margin-top:8px;font-size:.85rem}
  .empty .debug{margin-top:14px;font-size:.7rem;color:#475569;font-family:ui-monospace,monospace}
  .footer{margin-top:24px;text-align:center;color:#64748b;font-size:.8rem;padding-top:16px;border-top:1px solid #334155}
  .footer a{color:#60a5fa;text-decoration:none}
  .error{background:#7f1d1d;color:#fecaca;padding:14px;border-radius:8px;margin-bottom:14px;font-size:.85rem;display:none}
</style>
</head>
<body>
<div class="nav">
  <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <a class="brand" href="https://sportportal.com.au">SportPortal</a>
    <span style="opacity:.5">\u2022</span>
    <a href="${cfg.portalUrl}">${cfg.school}</a>
    <span style="opacity:.5">\u2022</span>
    <a href="${cfg.appUrl}">View school page</a>
  </div>
  <a class="pill" href="https://carnivaltiming.com">\u25CF All Events</a>
</div>
<div class="container">
  <div class="header">
    <h1>${cfg.title}</h1>
    <div class="sub">${cfg.subtitle}</div>
    <div class="meta">
      <span class="live off" id="live-badge"><span class="dot"></span> <span id="live-text">Connecting\u2026</span></span>
      <span id="meta-count">\u2014</span>
      <span id="meta-update" style="opacity:.7"></span>
    </div>
  </div>
  <div class="error" id="err"></div>
  <div class="carnival-pick" id="picker" style="display:none">
    <label for="carnivalSel">Carnival:</label>
    <select id="carnivalSel"></select>
  </div>
  <div class="stats" id="stats"></div>
  <div class="filter">
    <input id="q" type="search" placeholder="Search by name, school, house\u2026" autocomplete="off">
    <select id="houseFilter"><option value="">All houses / schools</option></select>
    <select id="ageFilter"><option value="">All age groups</option></select>
  </div>
  <div class="events" id="events"><div class="empty"><strong>Loading\u2026</strong></div></div>
  <div class="footer">Powered by <a href="https://carnivaltiming.com">Carnival Timing</a> \u00B7 Data: <a href="https://sportcarnival.com.au/api/status">carnival-results-d1</a> \u00B7 Carnival app: <a href="${cfg.appUrl}">${cfg.appUrl.replace('https://','')}</a></div>
</div>
<script>
(function(){
  const API_BASE = ${JSON.stringify(_CT_API_BASE)};
  const SCHOOL_RE = new RegExp(${JSON.stringify(cfg.schoolPattern)}, "i");
  const SPORT_RE = new RegExp(${JSON.stringify(cfg.sportPattern)}, "i");
  const EXCLUDE_DEMO = ${JSON.stringify(!!cfg.excludeDemo)};
  const POLL_LIST_MS = 30000; // refresh list of carnivals every 30s
  const POLL_RESULTS_MS = 5000; // refresh active carnival's results every 5s
  let allCarnivals = [];
  let selectedCode = null;
  let currentCarnival = null; // {code, meta, results}
  let listTimer = null, resultsTimer = null;
  let online = false;

  function fmtMs(ms){
    if(ms==null) return "\u2014";
    const n = Number(ms);
    if(!isFinite(n) || n<=0) return "\u2014";
    const totalSec = n / 1000;
    const m = Math.floor(totalSec/60);
    const s = (totalSec - m*60);
    return m>0 ? m + ":" + s.toFixed(2).padStart(5,"0") : s.toFixed(2) + "s";
  }
  function fmt(v){ return v==null||v===""?"\u2014":String(v).replace(/</g,"&lt;"); }

  function setLive(on, txt){
    online = on;
    const badge = document.getElementById("live-badge");
    badge.classList.toggle("off", !on);
    document.getElementById("live-text").textContent = txt || (on ? "Live" : "Connecting\u2026");
  }

  function showErr(msg){
    const e = document.getElementById("err");
    if(!msg){ e.style.display="none"; return; }
    e.style.display = "block"; e.textContent = msg;
  }

  function carnivalToGroups(carn){
    const groups = [];
    Object.entries(carn.results || {}).forEach(([raceKey, r]) => {
      if(!r || !Array.isArray(r.results)) return;
      const places = r.results.filter(Boolean).map(p => ({
        place: p.place || null,
        name: p.name || "",
        house: p.house || "",
        school: p.school || "",
        ms: p.timeMs != null ? p.timeMs : (p.elapsedMs != null ? p.elapsedMs : null)
      })).sort((a,b)=>(a.place||999)-(b.place||999));
      if(places.length === 0) return;
      groups.push({event:r.event||raceKey, age:r.age||"", gender:r.gender||"", publishedAt:r.publishedAt||0, places});
    });
    groups.sort((a,b)=>(b.publishedAt||0)-(a.publishedAt||0));
    return groups;
  }

  function applyFilters(groups){
    const q = (document.getElementById("q").value || "").toLowerCase();
    const houseF = document.getElementById("houseFilter").value;
    const ageF = document.getElementById("ageFilter").value;
    return groups.map(g => {
      if(ageF && g.age !== ageF) return null;
      const places = g.places.filter(p => {
        if(houseF && (p.house||p.school) !== houseF) return false;
        if(!q) return true;
        const hay = ((p.name||"") + " " + (p.house||"") + " " + (p.school||"")).toLowerCase();
        return hay.includes(q);
      });
      if(places.length === 0) return null;
      return Object.assign({}, g, {places});
    }).filter(Boolean);
  }

  function render(){
    if(!currentCarnival){
      document.getElementById("events").innerHTML = '<div class="empty"><strong>No active ${cfg.subtitle.replace(/'/g, "\\'")} carnival yet.</strong><p>Once your carnival app starts publishing results they will appear here within seconds.</p><div class="debug">Looking for: school~/' + SCHOOL_RE.source + '/i  sport~/' + SPORT_RE.source + '/i</div></div>';
      document.getElementById("meta-count").textContent = "\u2014";
      document.getElementById("stats").innerHTML = "";
      return;
    }
    const allGroups = carnivalToGroups(currentCarnival);
    const groups = applyFilters(allGroups);
    const el = document.getElementById("events");
    if(groups.length === 0){
      el.innerHTML = '<div class="empty"><strong>' + (allGroups.length===0 ? "Carnival connected \u2014 waiting for first published race." : "No results match your filter.") + '</strong>' + (allGroups.length===0 ? '<p>Showing: ' + fmt(currentCarnival.meta.name) + '</p>' : '') + '</div>';
    } else {
      el.innerHTML = groups.map(g => {
        const tag = (g.age||g.gender) ? ('<span class="tag">'+[g.age,g.gender].filter(Boolean).join(" \u00B7 ")+'</span>') : '';
        const hasHouse = g.places.some(p=>p.house);
        const hasSchool = g.places.some(p=>p.school);
        const hasMs = g.places.some(p=>p.ms);
        const headers = '<tr><th>#</th><th>Name</th>' + (hasHouse?'<th>House</th>':'') + (hasSchool?'<th>School</th>':'') + (hasMs?'<th style="text-align:right">Time</th>':'') + '</tr>';
        const rows = g.places.map(p => '<tr>' +
          '<td class="place">'+fmt(p.place||"")+'</td>' +
          '<td>'+fmt(p.name)+'</td>' +
          (hasHouse?'<td class="house">'+fmt(p.house)+'</td>':'') +
          (hasSchool?'<td class="school">'+fmt(p.school)+'</td>':'') +
          (hasMs?'<td class="num">'+fmtMs(p.ms)+'</td>':'') +
        '</tr>').join("");
        return '<div class="event"><h3>'+fmt(g.event)+tag+'</h3><table><thead>'+headers+'</thead><tbody>'+rows+'</tbody></table></div>';
      }).join("");
    }
    const placeCount = groups.reduce((s,g)=>s+g.places.length, 0);
    document.getElementById("meta-count").textContent = placeCount + " " + (placeCount===1?"result":"results") + (groups.length?(" across " + groups.length + " event"+(groups.length===1?"":"s")):"");
    // filters + stats
    const groupings = {};
    allGroups.forEach(g => g.places.forEach(p => { const k = p.house || p.school; if(k) groupings[k] = (groupings[k]||0)+1; }));
    const ages = new Set();
    allGroups.forEach(g => { if(g.age) ages.add(g.age); });
    const hf = document.getElementById("houseFilter"), af = document.getElementById("ageFilter");
    const prevH = hf.value, prevA = af.value;
    hf.innerHTML = '<option value="">All houses / schools</option>' + Object.keys(groupings).sort().map(h => '<option value="'+h+'">'+h+'</option>').join("");
    af.innerHTML = '<option value="">All age groups</option>' + [...ages].sort().map(a => '<option value="'+a+'">'+a+'</option>').join("");
    hf.value = prevH; af.value = prevA;
    const stats = [
      {k:"Results", v:allGroups.reduce((s,g)=>s+g.places.length, 0)},
      {k:"Events", v:allGroups.length},
      {k:"Houses / schools", v:Object.keys(groupings).length || "\u2014"},
      {k:"Carnival", v: fmt(currentCarnival.meta.name).slice(0,28)}
    ];
    document.getElementById("stats").innerHTML = stats.map(s => '<div class="stat"><div class="v">'+s.v+'</div><div class="k">'+s.k+'</div></div>').join("");
  }

  function refreshPicker(){
    const picker = document.getElementById("picker");
    const sel = document.getElementById("carnivalSel");
    if(allCarnivals.length === 0){ picker.style.display = "none"; return; }
    picker.style.display = allCarnivals.length > 1 ? "flex" : "none";
    const prev = sel.value;
    sel.innerHTML = allCarnivals.map(c => '<option value="'+c.code+'">'+fmt(c.name)+' \u00B7 '+fmt(c.school)+'</option>').join("");
    sel.value = prev && allCarnivals.find(c=>c.code===prev) ? prev : (allCarnivals[0] ? allCarnivals[0].code : "");
    if(sel.value !== selectedCode){
      selectedCode = sel.value;
      loadResults();
    }
  }

  async function loadList(){
    try {
      const r = await fetch(API_BASE + "/api/list", {cache: "no-store"});
      if(!r.ok) throw new Error("HTTP " + r.status);
      const list = await r.json();
      allCarnivals = list.filter(c => {
        if(!c || !c.school) return false;
        // demo carnivals don't have isDemo flag in /api/list; exclude by school name
        if(EXCLUDE_DEMO && /demo carnival/i.test(c.school)) return false;
        if(!SCHOOL_RE.test(c.school)) return false;
        if(!SPORT_RE.test(c.sport||"")) return false;
        return true;
      });
      // most-recent first
      allCarnivals.sort((a,b)=>(b.published_at||0)-(a.published_at||0));
      refreshPicker();
      setLive(true);
      showErr("");
    } catch (e) {
      setLive(false, "Connection error");
      showErr("Could not load carnival list: " + e.message);
    }
  }

  async function loadResults(){
    if(!selectedCode){ currentCarnival = null; render(); return; }
    try {
      const r = await fetch(API_BASE + "/api/results?carnival=" + encodeURIComponent(selectedCode), {cache: "no-store"});
      if(!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      if(!data || !data.ok) throw new Error("API returned not ok");
      currentCarnival = {code: data.code, meta: data.meta||{}, results: data.results||{}};
      setLive(true);
      showErr("");
      document.getElementById("meta-update").textContent = "updated " + new Date().toLocaleTimeString("en-AU", {hour12:false});
      render();
    } catch (e) {
      setLive(false, "Connection error");
      showErr("Could not load results for " + selectedCode + ": " + e.message);
    }
  }

  async function tick(){
    await loadList();
    await loadResults();
  }
  tick();
  listTimer = setInterval(loadList, POLL_LIST_MS);
  resultsTimer = setInterval(loadResults, POLL_RESULTS_MS);
  document.addEventListener("visibilitychange", () => {
    if(document.hidden){
      clearInterval(listTimer); clearInterval(resultsTimer);
    } else {
      loadList(); loadResults();
      listTimer = setInterval(loadList, POLL_LIST_MS);
      resultsTimer = setInterval(loadResults, POLL_RESULTS_MS);
    }
  });

  ["q","houseFilter","ageFilter"].forEach(id => document.getElementById(id).addEventListener("input", render));
  document.getElementById("carnivalSel").addEventListener("change", e => { selectedCode = e.target.value; loadResults(); });
})();
</script>
</body></html>`;
}

function _ctEventIndex() {
  const rows = Object.entries(_CT_EVENT_REGISTRY).map(([slug, cfg]) =>
    `<a class="card" href="/${slug}"><div class="ttl">${cfg.title.replace(' — Live Results','')}</div><div class="sub">${cfg.subtitle}</div><div class="cta">View live results \u2192</div></a>`
  ).join("");
  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Live Carnival Events \u2014 Carnival Timing</title>\n<link rel="canonical" href="https://carnivaltiming.com/">\n<meta name="description" content="Real-time results from active school sport carnivals. Athletics, swimming, cross country — track lane-by-lane finish times as they happen.">\n<meta property="og:title" content="Carnival Timing — Live Race Results">\n<meta property="og:description" content="Real-time results from active school sport carnivals.">\n<meta property="og:url" content="https://carnivaltiming.com/">\n<meta property="og:type" content="website">\n<meta property="og:image" content="https://carnivaltiming.com/og-card.png">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="https://carnivaltiming.com/og-card.png">\n<meta name="theme-color" content="#0d1b3e">\n<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Carnival Timing","url":"https://carnivaltiming.com","logo":"https://carnivaltiming.com/logo.png","applicationCategory":"SportsApplication","operatingSystem":"Web","creator":{"@type":"Organization","name":"Luck Dragon Pty Ltd"}}</script>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#fff;margin:0;padding:0;min-height:100vh}.nav{background:linear-gradient(90deg,#0d1b3e,#1a3a6e);padding:10px 16px;font-size:13px;font-weight:600}.nav a{color:#fcd34d;text-decoration:none}.container{max-width:840px;margin:0 auto;padding:36px 18px}h1{font-size:2rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px}.lede{color:#94a3b8;margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.card{display:block;background:#1e293b;border:1px solid #334155;padding:18px;border-radius:10px;text-decoration:none;color:#fff;transition:all .15s}.card:hover{border-color:#1d4ed8;transform:translateY(-1px);box-shadow:0 4px 12px rgba(29,78,216,.2)}.ttl{font-weight:700;font-size:1.05rem;margin-bottom:4px}.sub{color:#94a3b8;font-size:.85rem;margin-bottom:10px}.cta{color:#fcd34d;font-size:.85rem;font-weight:600}.foot{margin-top:32px;color:#64748b;font-size:.85rem;padding-top:18px;border-top:1px solid #334155}.foot a{color:#60a5fa}</style></head><body>
<div class="nav"><a href="https://sportportal.com.au">SportPortal</a> \u00B7 Live Timing</div>
<div class="container"><h1>Live Carnival Events</h1><div class="lede">Real-time results from active school sport carnivals. Data is read live from the D1-backed carnival timing engine.</div><div class="grid">${rows}</div><div class="foot">Don\u2019t see your event? Carnivals appear here once they\u2019re published. Marketing site: <a href="https://carnivaltiming.com/marketing">about Carnival Timing</a> \u00B7 Sport platform: <a href="https://sportportal.com.au">sportportal.com.au</a></div></div></body></html>`;
}





var _CT_OG_CARD_B64 = "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";
var _CT_LOGO_B64 = "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";
function _ctDecodeB64(b64) {
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

var worker_default = {
  async fetch(req, env, ctx) {
    const _u = new URL(req.url);
    {
      const _legalPaths = ['/cookies','/security','/sla','/child-safety','/accessibility','/about','/subprocessors','/changelog','/modern-slavery'];
      if (_legalPaths.includes(_u.pathname)) {
        return Response.redirect('https://sportportal.com.au' + _u.pathname, 301);
      }
    }

    if (_u.hostname === 'www.carnivaltiming.com') {
      return Response.redirect('https://carnivaltiming.com' + _u.pathname + _u.search, 301);
    }
    const _path = _u.pathname.replace(/\/$/, "") || "/";
    if (_path === "/og-card.png") return new Response(_ctDecodeB64(_CT_OG_CARD_B64), { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=2592000, immutable" } });
    if (_path === "/logo.png" || _path === "/apple-touch-icon.png" || _path === "/favicon.ico") return new Response(_ctDecodeB64(_CT_LOGO_B64), { status: 200, headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=2592000, immutable" } });
    if (_path === "/privacy") return new Response(PRIVACY_HTML, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    if (_path === "/terms") return new Response(TERMS_HTML, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    // /events — canonical redirect to / (was duplicate content)
    if (_path === "/events") return Response.redirect(new URL("/", req.url).toString(), 301);
    // /<slug> — per-event live results page (path 1 segment, matches registry)
    if (_path.startsWith("/") && _path.indexOf("/", 1) === -1) {
      const slug = _path.slice(1);
      const page = _ctEventPage(slug);
      if (page) return new Response(page, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Permissions-Policy": "camera=(self), microphone=(), geolocation=()" } });
    }
    // /marketing — old marketing landing (was apex)
    if (_path === "/sitemap.xml") return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://carnivaltiming.com/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>https://carnivaltiming.com/marketing</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wps-athletics-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wps-swimming-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wps-crosscountry-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wd-athletics-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wd-swimming-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wd-crosscountry-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wmr-crosscountry-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wyndham-athletics-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/wyndham-crosscountry-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/hobsonsbay-athletics-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://carnivaltiming.com/hobsonsbay-crosscountry-2026</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>
</urlset>`, { status: 200, headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" } });
    if (_path === "/robots.txt") return new Response("User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://carnivaltiming.com/sitemap.xml\n\nUser-agent: GPTBot\nDisallow: /\nUser-agent: ClaudeBot\nDisallow: /\nUser-agent: CCBot\nDisallow: /\nUser-agent: anthropic-ai\nDisallow: /\nUser-agent: Google-Extended\nDisallow: /\nUser-agent: Bytespider\nDisallow: /", { status: 200, headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=86400" } });
    if (_path === "/marketing") return new Response(HTML, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Permissions-Policy": "camera=(self), microphone=(), geolocation=()" } });
    // Known paths with no content on this domain — redirect to canonical SSP
    if (_path === "/contact") return Response.redirect("https://schoolsportportal.com.au/contact", 301);
    if (_path === "/forgot-password") return Response.redirect("https://schoolsportportal.com.au/forgot-password", 301);
    if (_path === "/signup" || _path === "/sign-up" || _path === "/register") return Response.redirect("https://schoolsportportal.com.au/contact", 301);
    if (_path === "/pricing") return Response.redirect("https://schoolsportportal.com.au/pricing", 301);
    if (_path === "/help") return Response.redirect("https://schoolsportportal.com.au/help", 301);
    // Unknown single-segment paths — 404
    if (_path !== "/" && _path.indexOf("/", 1) === -1) {
      const n404 = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not found \u2014 Carnival Timing</title><style>body{font-family:sans-serif;text-align:center;padding:60px 20px;color:#334155}h1{color:#0d1b3e}a{color:#1d4ed8}</style></head><body><h1>404</h1><p>That page doesn't exist on Carnival Timing.</p><p><a href="/">Back to live events</a> &nbsp;&middot;&nbsp; <a href="https://schoolsportportal.com.au">School Sport Portal</a></p></body></html>`;
      return new Response(n404, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    // /api/* — return JSON 404 (don't fall through to HTML SPA)
    if (_path.startsWith("/api/")) {
      return new Response(JSON.stringify({ ok: false, error: "endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" }
      });
    }
    // Apex — show event index (was marketing). Old marketing still at /marketing.
    return new Response(_ctEventIndex(), { headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self' 'unsafe-inline' https: wss: data: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'self';", "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Resource-Policy": "same-site"
    } });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=ct-worker.js.map