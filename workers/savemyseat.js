export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname === '/manifest.json') return new Response(`{"name":"Save My Seat","short_name":"Save My Seat","start_url":"/","display":"standalone","background_color":"#07091a","theme_color":"#ffd23f","icons":[{"src":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='#ffd23f'/%3E%3Ctext x='32' y='44' text-anchor='middle' font-size='36'%3E%F0%9F%AA%91%3C/text%3E%3C/svg%3E","sizes":"64x64","type":"image/svg+xml"},{"src":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='42' fill='%23ffd23f'/%3E%3Ctext x='96' y='132' text-anchor='middle' font-size='108'%3E%F0%9F%AA%91%3C/text%3E%3C/svg%3E","sizes":"192x192","type":"image/svg+xml"},{"src":"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='112' fill='%23ffd23f'/%3E%3Ctext x='256' y='352' text-anchor='middle' font-size='288'%3E%F0%9F%AA%91%3C/text%3E%3C/svg%3E","sizes":"512x512","type":"image/svg+xml"}]}`, {headers:{'Content-Type':'application/manifest+json','Cache-Control':'public,max-age=86400'}});
    if(url.pathname==='/health') return new Response(JSON.stringify({ok:true,version:"12.7-splash"}),{headers:{'Content-Type':'application/json'}});
    return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="Save My Seat"/>
<meta name="theme-color" content="#07091a" id="themeColor"/>
<title>Save My Seat</title>
<link rel="manifest" href="data:application/json;base64,eyJuYW1lIjogIlNhdmUgTXkgU2VhdCIsICJzaG9ydF9uYW1lIjogIlNhdmUgTXkgU2VhdCIsICJzdGFydF91cmwiOiAiLyIsICJkaXNwbGF5IjogInN0YW5kYWxvbmUiLCAiYmFja2dyb3VuZF9jb2xvciI6ICIjMDcwOTFhIiwgInRoZW1lX2NvbG9yIjogIiNmZmQyM2YiLCAiaWNvbnMiOiBbeyJzcmMiOiAiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA2NCA2NCclM0UlM0NyZWN0IHdpZHRoPSc2NCcgaGVpZ2h0PSc2NCcgcng9JzE0JyBmaWxsPScjZmZkMjNmJy8lM0UlM0N0ZXh0IHg9JzMyJyB5PSc0NCcgdGV4dC1hbmNob3I9J21pZGRsZScgZm9udC1zaXplPSczNiclM0UlRjAlOUYlQUElOTElM0MvdGV4dCUzRSUzQy9zdmclM0UiLCAic2l6ZXMiOiAiNjR4NjQiLCAidHlwZSI6ICJpbWFnZS9zdmcreG1sIn0sIHsic3JjIjogImRhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyB2aWV3Qm94PScwIDAgMTkyIDE5MiclM0UlM0NyZWN0IHdpZHRoPScxOTInIGhlaWdodD0nMTkyJyByeD0nNDInIGZpbGw9JyUyM2ZmZDIzZicvJTNFJTNDdGV4dCB4PSc5NicgeT0nMTMyJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJyBmb250LXNpemU9JzEwOCclM0UlRjAlOUYlQUElOTElM0MvdGV4dCUzRSUzQy9zdmclM0UiLCAic2l6ZXMiOiAiMTkyeDE5MiIsICJ0eXBlIjogImltYWdlL3N2Zyt4bWwifSwgeyJzcmMiOiAiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA1MTIgNTEyJyUzRSUzQ3JlY3Qgd2lkdGg9JzUxMicgaGVpZ2h0PSc1MTInIHJ4PScxMTInIGZpbGw9JyUyM2ZmZDIzZicvJTNFJTNDdGV4dCB4PScyNTYnIHk9JzM1MicgdGV4dC1hbmNob3I9J21pZGRsZScgZm9udC1zaXplPScyODgnJTNFJUYwJTlGJUFBJTkxJTNDL3RleHQlM0UlM0Mvc3ZnJTNFIiwgInNpemVzIjogIjUxMng1MTIiLCAidHlwZSI6ICJpbWFnZS9zdmcreG1sIn1dfQ=="/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23ffd23f'/%3E%3Ctext x='32' y='44' text-anchor='middle' font-size='36'%3E%F0%9F%AA%91%3C/text%3E%3C/svg%3E"/>
<style>
:root{--bg:#07091a;--card:#0f1228;--card2:#161a34;--accent:#ffd23f;--accent2:#ff6b35;--green:#4ade80;--red:#ef4444;--text:#e6e9f2;--muted:#8a91a8;--r:18px}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
html,body{background:var(--bg);color:var(--text);font:16px/1.5 -apple-system,system-ui,sans-serif;height:100%;overflow:hidden;-webkit-font-smoothing:antialiased}
body{display:flex;flex-direction:column;max-width:480px;margin:0 auto;position:relative}

/* NAV */
.nav{display:flex;background:rgba(7,9,26,0.92);backdrop-filter:blur(20px);padding:10px 8px max(env(safe-area-inset-bottom),12px);border-top:1px solid rgba(255,255,255,0.06);position:relative;z-index:10;flex-shrink:0}
.nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:0;color:var(--muted);font:500 10px -apple-system,system-ui;cursor:pointer;padding:6px 4px;border-radius:12px;transition:color 0.2s}
.nav button svg{width:22px;height:22px;stroke-width:1.8}
.nav button.active{color:var(--accent)}
.nav-indicator{position:absolute;bottom:calc(max(env(safe-area-inset-bottom),12px) + 4px);height:3px;background:var(--accent);border-radius:99px;transition:all 0.3s cubic-bezier(.4,0,.2,1);pointer-events:none}

/* VIEWS */
.swipe-container{flex:1;overflow:hidden;position:relative}
.swipe-track{display:flex;height:100%;transition:transform 0.32s cubic-bezier(.4,0,.2,1)}
.swipe-track.dragging{transition:none}
.view{flex:0 0 100%;height:100%;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:max(env(safe-area-inset-top),20px) 18px 20px}

/* CARDS */
.card{background:var(--card);border:1px solid rgba(255,255,255,0.07);border-radius:var(--r);padding:18px;margin-bottom:12px}
.card.glow-gold{border-color:rgba(255,210,63,0.3);box-shadow:0 0 0 1px rgba(255,210,63,0.15) inset,0 16px 40px -16px rgba(255,210,63,0.2)}
.card.glow-orange{border-color:rgba(255,107,53,0.3);box-shadow:0 0 0 1px rgba(255,107,53,0.15) inset,0 16px 40px -16px rgba(255,107,53,0.25)}
.card.glow-green{border-color:rgba(74,222,128,0.2);box-shadow:0 0 0 1px rgba(74,222,128,0.1) inset}

/* BIG HOLD BUTTON */
.hold-btn{display:block;width:100%;padding:20px;border-radius:20px;border:0;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#07091a;font:800 20px -apple-system,system-ui;cursor:pointer;transition:transform 0.12s,box-shadow 0.12s;box-shadow:0 12px 40px -8px rgba(255,107,53,0.5);margin:8px 0 16px;letter-spacing:-0.3px;position:relative;overflow:hidden}
.hold-btn:active{transform:scale(0.97)}
.hold-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.hold-btn .btn-sub{font:500 13px -apple-system,system-ui;opacity:0.7;margin-top:2px;display:block}

/* REGULAR BUTTONS */
.btn{display:block;width:100%;padding:15px 18px;border-radius:14px;border:0;background:var(--card2);color:var(--text);font:600 15px -apple-system,system-ui;cursor:pointer;transition:transform 0.1s,background 0.15s;margin-bottom:10px;position:relative;overflow:hidden}
.btn:active{transform:scale(0.98)}
.btn:disabled{opacity:0.4;cursor:not-allowed}
.btn.green{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 8px 24px -8px rgba(34,197,94,0.4)}
.btn.orange{background:rgba(255,107,53,0.15);color:var(--accent2);border:1px solid rgba(255,107,53,0.25)}
.btn.ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)}
.btn.danger{background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.2)}
.mini-row{display:flex;gap:8px;margin-bottom:10px}
.mini-row .btn{margin:0;padding:12px;font-size:14px}
.ripple{position:absolute;border-radius:50%;background:rgba(255,255,255,0.2);transform:scale(0);animation:rippleAnim 0.5s ease-out;pointer-events:none}
@keyframes rippleAnim{to{transform:scale(4);opacity:0}}

/* RING TIMER */
.ring-wrap{display:flex;justify-content:center;padding:8px 0 16px;position:relative}
.ring-wrap svg{width:180px;height:180px}
.ring-bg{fill:none;stroke:rgba(255,255,255,0.06);stroke-width:10}
.ring-fg{fill:none;stroke-width:10;stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 0.9s linear}
.ring-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;line-height:1.2}
.ring-time{font:800 40px -apple-system,system-ui;letter-spacing:-2px;color:var(--accent)}
.ring-time.away{color:var(--accent2)}
.ring-label{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);font-weight:700}
.ring-sub{font-size:12px;color:var(--muted);margin-top:3px}

/* SEAT INPUT */
.seat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px}
.seat-grid-labels{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:4px}
.seat-grid-labels span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;padding-left:2px}
.input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--text);font:600 15px -apple-system,system-ui;-webkit-appearance:none}
.input:focus{outline:2px solid var(--accent);border-color:transparent}
select.input{cursor:pointer}

/* SHARE STRIP */
.share-strip{display:flex;align-items:center;gap:10px;background:rgba(255,210,63,0.08);border:1px solid rgba(255,210,63,0.2);border-radius:14px;padding:12px 14px;margin-bottom:12px;cursor:pointer}
.share-strip:active{background:rgba(255,210,63,0.14)}
.share-icon{font-size:20px;flex-shrink:0}
.share-text{flex:1;min-width:0}
.share-text-label{font-size:13px;font-weight:700;color:var(--accent)}
.share-text-url{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.share-copy-btn{font-size:12px;font-weight:700;color:var(--accent);background:rgba(255,210,63,0.15);padding:6px 12px;border-radius:8px;border:0;cursor:pointer;flex-shrink:0;white-space:nowrap}

/* CREW CARD */
.crew-member{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
.crew-member:last-child{border-bottom:0;padding-bottom:0}
.crew-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#07091a;flex-shrink:0}
.crew-info{flex:1;min-width:0}
.crew-name{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crew-seat{font-size:12px;color:var(--muted)}
.crew-status{font-size:12px;font-weight:700;flex-shrink:0}
.crew-status.held{color:var(--accent)}
.crew-status.away{color:var(--accent2)}
.crew-status.free{color:var(--muted)}

/* TOASTS */
.toast-stack{position:fixed;top:14px;left:50%;transform:translateX(-50%);max-width:420px;width:calc(100% - 24px);z-index:100;pointer-events:none}
.toast{background:rgba(15,18,40,0.96);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:10px 14px;margin-bottom:8px;font-size:13px;display:flex;align-items:center;gap:10px;animation:toastIn 0.25s ease}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px) scale(0.95)}}
.toast.out{animation:toastOut 0.25s ease forwards}
@keyframes toastOut{to{opacity:0;transform:translateY(-8px) scale(0.95)}}
.t-icon{font-size:18px;flex-shrink:0}
.t-title{font-weight:700;font-size:13px}
.t-body{color:var(--muted);font-size:12px}

/* ONBOARD */
.onboard-overlay{position:fixed;inset:0;background:var(--bg);z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;gap:20px}
.onboard-icon{font-size:64px;margin-bottom:4px}
.onboard-title{font-size:32px;font-weight:800;text-align:center;line-height:1.1}
.onboard-sub{font-size:15px;color:var(--muted);text-align:center;max-width:280px;line-height:1.6}
.name-input{width:100%;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:var(--text);font:600 17px -apple-system,system-ui;text-align:center;max-width:360px;-webkit-appearance:none}
.name-input:focus{outline:2px solid var(--accent);border-color:transparent}
.skip-link{color:var(--muted);font-size:13px;background:none;border:0;cursor:pointer;text-decoration:underline}

/* LOGIN (email + 6-digit PIN) */
.login-overlay{position:fixed;inset:0;background:var(--bg);z-index:210;display:none;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;gap:14px}
.login-overlay.show{display:flex}
.login-icon{font-size:56px;margin-bottom:4px}
.login-title{font-size:28px;font-weight:800;text-align:center;line-height:1.1}
.login-sub{font-size:14px;color:var(--muted);text-align:center;max-width:320px;line-height:1.5;margin-bottom:4px}
.login-sub b{color:var(--text);font-weight:700}
.pin-boxes{display:flex;gap:8px;justify-content:center;margin:4px 0}
.pin-box{width:44px;height:54px;text-align:center;font:800 22px -apple-system,system-ui;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:var(--text);-webkit-appearance:none;font-variant-numeric:tabular-nums}
.pin-box:focus{outline:2px solid var(--accent);border-color:transparent}
.login-err{color:#ef4444;font-size:13px;text-align:center;min-height:18px}
.link-btn{color:var(--muted);font-size:13px;background:none;border:0;cursor:pointer;text-decoration:underline;padding:4px 8px}
.link-btn:hover{color:var(--text)}

/* HEADINGS */
h1{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--accent);font-weight:800;margin:0 0 2px}
h2{font-size:26px;font-weight:800;margin:0 0 2px;line-height:1.15}
.sub{color:var(--muted);font-size:13px;margin-bottom:18px;display:flex;align-items:center;gap:6px}
.rt-dot{width:7px;height:7px;border-radius:50%;background:var(--green);display:inline-block;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}

/* STATUS ROW */
.status-row{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.dot{width:11px;height:11px;border-radius:50%;background:var(--muted);flex-shrink:0}
.dot.held{background:var(--accent);box-shadow:0 0 0 4px rgba(255,210,63,0.15)}
.dot.away{background:var(--accent2);box-shadow:0 0 0 4px rgba(255,107,53,0.15)}
.dot.free{background:var(--green);box-shadow:0 0 0 4px rgba(74,222,128,0.12)}
.status-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);font-weight:700}
.status-title{font-size:18px;font-weight:700}

/* DEST PICKER */
.dest-picker{display:flex;gap:8px;margin-bottom:12px}
.dest-btn{flex:1;padding:10px 6px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--muted);font:600 12px -apple-system,system-ui;cursor:pointer;text-align:center;display:flex;flex-direction:column;gap:2px;align-items:center;transition:all 0.15s}
.dest-btn.active{background:rgba(255,210,63,0.12);border-color:rgba(255,210,63,0.35);color:var(--accent)}
.dest-btn .dest-icon{font-size:18px}

/* DUR PICKER */
.dur-picker{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.dur-btn{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:var(--muted);font:600 13px -apple-system,system-ui;cursor:pointer;transition:all 0.15s}
.dur-btn.active{background:rgba(255,107,53,0.12);border-color:rgba(255,107,53,0.35);color:var(--accent2)}

/* CREW INVITE CARD */
.crew-code-display{text-align:center;padding:20px;background:rgba(255,210,63,0.06);border:1px solid rgba(255,210,63,0.15);border-radius:16px;margin-bottom:12px}
.crew-code-label{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:var(--muted);font-weight:700;margin-bottom:8px}
.crew-code-value{font-size:36px;font-weight:800;color:var(--accent);letter-spacing:4px;margin-bottom:12px;font-variant-numeric:tabular-nums}

/* KV ROW */
.kv{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:14px}
.kv:last-child{border-bottom:0}
.kv .k{color:var(--muted)}
.kv .v{font-weight:600}

/* SETTINGS */
.setting-row{display:flex;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer}
.setting-row:last-child{border-bottom:0}
.setting-icon{width:36px;height:36px;border-radius:10px;background:rgba(255,210,63,0.1);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;margin-right:12px}
.setting-left{display:flex;align-items:center;flex:1;min-width:0}
.setting-label{font-weight:600;font-size:14px}
.setting-desc{font-size:12px;color:var(--muted)}
.setting-value{font-size:13px;color:var(--accent);font-weight:700;flex-shrink:0;margin-left:8px}
.toggle{width:46px;height:26px;border-radius:99px;background:rgba(255,255,255,0.12);border:0;cursor:pointer;position:relative;flex-shrink:0;transition:background 0.2s}
.toggle::after{content:"";position:absolute;width:20px;height:20px;border-radius:50%;background:#fff;top:3px;left:3px;transition:transform 0.2s}
.toggle.on{background:var(--accent)}
.toggle.on::after{transform:translateX(20px)}

/* CONFETTI */
#confetti{position:fixed;inset:0;pointer-events:none;z-index:50}

/* MISC */
.recent-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:99px;padding:5px 12px;font-size:13px;font-weight:600;margin:0 4px 6px 0;cursor:pointer;transition:background 0.15s}
.recent-chip:active{background:rgba(255,255,255,0.1)}
.section-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:700;margin-bottom:8px;margin-top:4px}
.empty-state{text-align:center;padding:40px 20px;color:var(--muted);font-size:14px}
.empty-icon{font-size:40px;margin-bottom:12px;opacity:0.5}
footer{text-align:center;font-size:11px;color:rgba(138,145,168,0.4);padding:12px 0 0}

/* STAFF / ADMIN VIEWS */
.dash{max-width:960px;margin:0 auto;padding:max(env(safe-area-inset-top),20px) 20px 32px;min-height:100vh;overflow-y:auto}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:var(--card);border:1px solid rgba(255,255,255,0.07);border-radius:var(--r);padding:18px;text-align:center}
.stat-num{font-size:40px;font-weight:800;line-height:1;margin-bottom:4px}
.stat-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);font-weight:700}
.dash-table-row{display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.dash-table-row:last-child{border-bottom:0}
.dash-badge{padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
.badge-held{background:rgba(255,210,63,0.15);color:var(--accent)}
.badge-away{background:rgba(255,107,53,0.15);color:var(--accent2)}
.clear-btn{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.2);color:#ef4444;padding:7px 14px;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0;transition:background 0.15s}
.clear-btn:hover{background:rgba(239,68,68,0.2)}
.refresh-btn{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--muted);padding:7px 14px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600}
.venue-card{background:var(--card);border:1px solid rgba(255,255,255,0.07);border-radius:var(--r);padding:18px;margin-bottom:12px;display:flex;align-items:center;gap:16px}
.venue-icon{font-size:36px;flex-shrink:0}
.venue-info{flex:1}
.venue-name{font-weight:800;font-size:16px;margin-bottom:2px}
.venue-meta{font-size:13px;color:var(--muted)}
.venue-stats{text-align:right;flex-shrink:0}
.venue-count{font-size:28px;font-weight:800;color:var(--accent);line-height:1}
.venue-away{font-size:12px;color:var(--accent2)}
@media(max-width:600px){.stat-grid{grid-template-columns:repeat(2,1fr)}}

/* SPLASH */
.splash-overlay{position:fixed;inset:0;background:var(--bg);z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px 24px;gap:0;text-align:center}
.splash-overlay.hidden{display:none!important}
.splash-icon{font-size:72px;margin-bottom:16px;animation:seatBounce 1.4s ease-in-out infinite alternate}
@keyframes seatBounce{from{transform:translateY(0)}to{transform:translateY(-10px)}}
.splash-title{font-size:38px;font-weight:900;letter-spacing:-1px;margin-bottom:8px}
.splash-tag{font-size:16px;color:var(--muted);margin-bottom:28px;line-height:1.6}
.splash-steps{display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px;margin-bottom:32px}
.splash-step{display:flex;align-items:center;gap:14px;background:var(--card);border-radius:14px;padding:13px 16px;text-align:left}
.splash-step-icon{font-size:22px;flex-shrink:0}
.splash-step-text{font-size:13px;color:var(--text);line-height:1.45}

</style>
</head>
<body>
<canvas id="confetti"></canvas>
<div class="toast-stack" id="toastStack"></div>

<!-- ═══ STAFF VIEW ═══════════════════════════════════════════════════════ -->
<div id="staffView" style="display:none;background:var(--bg);min-height:100vh">
  <div class="dash">
    <h1 style="margin-bottom:2px">⚡ SAVE MY SEAT</h1>
    <h2 style="font-size:28px;font-weight:800;margin-bottom:2px">Staff Dashboard</h2>
    <div style="color:var(--muted);font-size:13px;margin-bottom:20px">Live seat holds · auto-refreshes every 30s</div>

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num gold" id="sTotal" style="color:var(--accent)">—</div><div class="stat-label">Total active</div></div>
      <div class="stat-card"><div class="stat-num" id="sHeld" style="color:var(--accent)">—</div><div class="stat-label">Held</div></div>
      <div class="stat-card"><div class="stat-num" id="sAway" style="color:var(--accent2)">—</div><div class="stat-label">Away</div></div>
      <div class="stat-card"><div class="stat-num" id="sSync" style="font-size:13px;color:var(--green);padding-top:8px">● Live</div><div class="stat-label">Status</div></div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-weight:800;font-size:16px">Active Holds</div>
        <button class="refresh-btn" onclick="loadStaff()">↻ Refresh</button>
      </div>
      <div id="staffList"><div style="text-align:center;padding:32px;color:var(--muted)">Loading…</div></div>
    </div>

    <div style="text-align:center;margin-top:20px;font-size:12px;color:rgba(138,145,168,0.4)">Save My Seat Staff · savemyseat.au</div>
  </div>
</div>

<!-- ═══ ADMIN VIEW ════════════════════════════════════════════════════════ -->
<div id="adminView" style="display:none;background:var(--bg);min-height:100vh">
  <div class="dash">
    <h1 style="margin-bottom:2px">🔑 SAVE MY SEAT</h1>
    <h2 style="font-size:28px;font-weight:800;margin-bottom:2px">Admin Dashboard</h2>
    <div style="color:var(--muted);font-size:13px;margin-bottom:20px" id="adminLastSync">Loading…</div>

    <div class="stat-grid" style="margin-bottom:20px">
      <div class="stat-card"><div class="stat-num" id="aTotal" style="color:var(--accent)">—</div><div class="stat-label">Live holds</div></div>
      <div class="stat-card"><div class="stat-num" id="aAway" style="color:var(--accent2)">—</div><div class="stat-label">Away right now</div></div>
      <div class="stat-card"><div class="stat-num" id="aCrews" style="color:#60a5fa">—</div><div class="stat-label">Active crews</div></div>
      <div class="stat-card"><div class="stat-num" id="aAvgTime" style="color:var(--green);font-size:22px;padding-top:8px">—</div><div class="stat-label">Avg time left</div></div>
    </div>

    <div style="font-weight:800;font-size:16px;margin-bottom:12px">Live by Venue</div>
    <div id="adminVenues" style="margin-bottom:24px"></div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-weight:800;font-size:16px">All Active Holds</div>
        <div style="display:flex;gap:8px">
          <button class="refresh-btn" onclick="loadAdmin()">↻ Refresh</button>
          <button class="refresh-btn" onclick="exportCSV()" style="color:var(--accent);border-color:rgba(255,210,63,0.3)">↓ CSV</button>
        </div>
      </div>
      <div id="adminList"><div style="text-align:center;padding:32px;color:var(--muted)">Loading…</div></div>
    </div>

    <div style="text-align:center;margin-top:20px;font-size:12px;color:rgba(138,145,168,0.4)">Save My Seat Admin · savemyseat.au</div>
  </div>
</div>

<!-- ═══ ADMIN LOGIN ════════════════════════════════════════════════════════ -->
<div id="adminLogin" style="display:none;background:var(--bg);min-height:100vh;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;padding:32px">
  <div style="font-size:48px">🔑</div>
  <div style="font-size:24px;font-weight:800">Admin Access</div>
  <input id="adminKeyInput" type="password" class="input" placeholder="Enter admin key" style="max-width:320px;text-align:center" onkeydown="if(event.key==='Enter')checkAdminKey()"/>
  <button class="hold-btn" onclick="checkAdminKey()" style="max-width:320px;font-size:16px;padding:15px;margin:0">Enter</button>
</div>

<!-- SPLASH -->
<div class="splash-overlay" id="splashOverlay">
  <div class="splash-icon">&#x1FA91;</div>
  <div class="splash-title">Save My Seat</div>
  <div class="splash-tag">Hold your seat.<br>Share it live.</div>
  <div class="splash-steps">
    <div class="splash-step"><div class="splash-step-icon">&#x1F4E7;</div><div class="splash-step-text"><b>Log in with your email</b> &mdash; we send a 6-digit code. No password needed.</div></div>
    <div class="splash-step"><div class="splash-step-icon">&#x1FA91;</div><div class="splash-step-text"><b>Tap Hold</b> &mdash; your seat is reserved with a live countdown your mates can see.</div></div>
    <div class="splash-step"><div class="splash-step-icon">&#x1F4F2;</div><div class="splash-step-text"><b>Share the link</b> &mdash; anyone with it sees your seat update in real time.</div></div>
  </div>
  <button class="hold-btn" onclick="dismissSplash()" style="max-width:340px;font-size:18px;padding:18px;margin:0">Get started &#x2192;</button>
</div>

<!-- LOGIN: step 1 (email) + step 2 (6-digit PIN) -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-icon">🪑</div>
  <div class="login-title">Save My Seat</div>

  <!-- Step 1: email -->
  <div id="loginStep1" style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:360px">
    <div class="login-sub">Enter your email — we'll send you a <b>6-digit code</b> to log in. No password to remember.</div>
    <input class="name-input" id="loginEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" autocorrect="off" placeholder="you@email.com"/>
    <button class="hold-btn" id="sendPinBtn" onclick="sendPin()" style="max-width:360px;font-size:17px;padding:16px;margin:0">Send PIN</button>
    <div class="login-err" id="loginErr1"></div>
  </div>

  <!-- Step 2: PIN -->
  <div id="loginStep2" style="display:none;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:360px">
    <div class="login-sub">Check <b id="loginEmailEcho"></b> for a 6-digit code. Type it in below.</div>
    <div class="pin-boxes" id="pinBoxes">
      <input class="pin-box" type="tel" inputmode="numeric" maxlength="1" data-i="0"/>
      <input class="pin-box" type="tel" inputmode="numeric" maxlength="1" data-i="1"/>
      <input class="pin-box" type="tel" inputmode="numeric" maxlength="1" data-i="2"/>
      <input class="pin-box" type="tel" inputmode="numeric" maxlength="1" data-i="3"/>
      <input class="pin-box" type="tel" inputmode="numeric" maxlength="1" data-i="4"/>
      <input class="pin-box" type="tel" inputmode="numeric" maxlength="1" data-i="5"/>
    </div>
    <button class="hold-btn" id="verifyPinBtn" onclick="verifyPin()" style="max-width:360px;font-size:17px;padding:16px;margin:0">Verify PIN</button>
    <div class="login-err" id="loginErr2"></div>
    <div style="display:flex;gap:8px">
      <button class="link-btn" onclick="resendPin()">Resend PIN</button>
      <span style="color:var(--muted)">·</span>
      <button class="link-btn" onclick="changeEmail()">Change email</button>
    </div>
  </div>
</div>

<!-- ONBOARD (name + initial setup AFTER login) -->
<div class="onboard-overlay" id="onboard" style="display:none">
  <div class="onboard-icon">🪑</div>
  <div class="onboard-title">Nice — you're in</div>
  <div class="onboard-sub">What's your name? (your crew will see it)</div>
  <input class="name-input" id="onboardName" placeholder="Your name" maxlength="24" autocomplete="given-name"/>
  <button class="hold-btn" onclick="finishOnboard()" style="max-width:360px;font-size:18px;padding:17px">Let's go 🚀</button>
  <button class="skip-link" onclick="skipOnboard()">Skip for now</button>
</div>

<!-- VIEWS -->
<div class="swipe-container" id="swipeContainer">
<div class="swipe-track" id="swipeTrack">

<!-- HOME -->
<div class="view" id="v-home">
  <h1>SAVE MY SEAT</h1>
  <h2 id="homeTitle">Your seat</h2>
  <div class="sub"><span class="rt-dot"></span><span id="rtStatus">REALTIME</span></div>

  <!-- SHARE STRIP — shown after holding -->
  <div class="share-strip" id="shareStrip" style="display:none" onclick="copyLink()">
    <div class="share-icon">🔗</div>
    <div class="share-text">
      <div class="share-text-label">Share with mates</div>
      <div class="share-text-url" id="shareUrlShort">savemyseat.au?seat=...</div>
    </div>
    <button class="share-copy-btn" id="shareCopyBtn">Copy</button>
  </div>

  <!-- SEAT CARD: FREE STATE -->
  <div class="card" id="freeCard">
    <input class="input" id="nameInput" placeholder="Your name (shown to neighbours)" maxlength="24" autocomplete="given-name" autocorrect="off" style="margin-bottom:10px" onfocus="this.select()"/>

    <!-- GPS DETECT BUTTON -->
    <button class="btn ghost" id="detectBtn" onclick="detectMyGPSSeat()" style="margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px">
      <span id="detectIcon">📍</span> <span id="detectLabel">Detect my seat automatically</span>
    </button>

    <!-- GPS RESULT BANNER -->
    <div id="gpsResult" style="display:none;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:13px">
      <div style="font-weight:700;color:var(--green);margin-bottom:4px" id="gpsResultTitle">📍 Detected: Bay M42, Row J</div>
      <div style="color:var(--muted)" id="gpsResultSub">Enter your seat number to confirm</div>
    </div>

    <div class="section-label" id="seatInputLabel">Your seat</div>
    <div class="seat-grid-labels"><span>Bay</span><span>Row</span><span>Seat</span></div>
    <div class="seat-grid">
      <input class="input" id="bayInput" placeholder="M42" maxlength="8" autocomplete="off" autocorrect="off" autocapitalize="characters" style="text-align:center" onfocus="this.select()"/>
      <input class="input" id="rowInput" placeholder="J" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" style="text-align:center" onfocus="this.select()"/>
      <input class="input" id="seatNumInput" placeholder="15" maxlength="6" autocomplete="off" autocorrect="off" style="text-align:center" onfocus="this.select()"/>
    </div>
    <button class="hold-btn" id="holdBtn" onclick="holdSeat()">
      Hold My Seat 🪑
      <span class="btn-sub">Saves your spot for up to 3 hours</span>
    </button>
    <div id="recentSeatsWrap" style="display:none">
      <div class="section-label">Recent seats</div>
      <div id="recentSeats"></div>
    </div>
  </div>

  <!-- SEAT CARD: HELD STATE -->
  <div class="card glow-gold" id="heldCard" style="display:none">
    <div class="status-row"><div class="dot held" id="statusDot"></div><div><div class="status-label" id="statusLabel">HELD</div><div class="status-title" id="statusTitle">Your seat is saved</div></div></div>
    <div class="ring-wrap" id="ringWrap">
      <svg viewBox="0 0 180 180">
        <circle class="ring-bg" cx="90" cy="90" r="75"/>
        <circle class="ring-fg" id="ringFg" cx="90" cy="90" r="75" stroke="url(#rg)" stroke-dasharray="471.24" stroke-dashoffset="0"/>
        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffd23f"/><stop offset="100%" stop-color="#ff6b35"/></linearGradient></defs>
      </svg>
      <div class="ring-center">
        <div class="ring-time" id="ringTime">--:--</div>
        <div class="ring-label" id="ringLabel">remaining</div>
        <div class="ring-sub" id="ringEta"></div>
      </div>
    </div>
    <!-- HELD ACTIONS -->
    <div id="heldActions">
      <div class="dest-picker" id="destPicker">
        <button class="dest-btn active" data-dest="food" onclick="selectDest(this)"><span class="dest-icon">🍟</span>Food</button>
        <button class="dest-btn" data-dest="bar" onclick="selectDest(this)"><span class="dest-icon">🍺</span>Bar</button>
        <button class="dest-btn" data-dest="bathroom" onclick="selectDest(this)"><span class="dest-icon">🚽</span>Bathroom</button>
        <button class="dest-btn" data-dest="" onclick="selectDest(this)"><span class="dest-icon">🚶</span>Other</button>
      </div>
      <div class="dur-picker" id="durPicker">
        <button class="dur-btn active" data-min="10">10 min</button>
        <button class="dur-btn" data-min="15">15 min</button>
        <button class="dur-btn" data-min="20">20 min</button>
        <button class="dur-btn" data-min="30">30 min</button>
      </div>
      <button class="btn orange" onclick="goAway()" style="width:100%;margin-bottom:8px">Leaving my seat 🏃</button>
      <div class="mini-row">
        <button class="btn ghost" onclick="extendHold()">+1 hr ⏰</button>
        <button class="btn danger" onclick="confirmRelease()">Release 🙋</button>
      </div>
    </div>
    <!-- AWAY ACTIONS -->
    <div id="awayActions" style="display:none">
      <button class="btn green" onclick="returnToSeat()" style="font-size:18px;padding:18px;margin-bottom:8px">I'm Back! 👟</button>
      <div class="mini-row">
        <button class="btn ghost" onclick="extendAway()">+10 min ⏰</button>
        <button class="btn danger" onclick="confirmRelease()">Release 🙋</button>
      </div>
    </div>
  </div>

  <!-- NEIGHBOUR VIEW (someone else's seat) -->
  <div class="card glow-green" id="neighborCard" style="display:none">
    <div style="text-align:center;padding:16px 0">
      <div style="font-size:48px;margin-bottom:8px" id="nAvatar">😊</div>
      <div style="font-size:20px;font-weight:800;margin-bottom:4px" id="nName">Someone</div>
      <div style="color:var(--muted);font-size:14px" id="nMsg">is holding this seat</div>
      <div style="color:var(--accent);font-size:28px;font-weight:800;margin-top:12px" id="nTimer">--:--</div>
      <div style="color:var(--muted);font-size:12px">back in</div>
    </div>
  </div>

  <!-- INFO CARD -->
  <div class="card" id="infoCard">
    <div class="kv"><div class="k">Seat</div><div class="v" id="kvSeat">–</div></div>
    <div class="kv"><div class="k">Status</div><div class="v" id="kvHolder">Free</div></div>
  </div>

  <footer>Save My Seat v12.7 · savemyseat.au · 2026</footer>
</div>

<!-- CREW TAB -->
<div class="view" id="v-crew">
  <h1>YOUR CREW</h1>
  <h2>Family &amp; Friends</h2>
  <div class="sub" style="margin-bottom:20px">See everyone's seat live</div>

  <!-- Not in a crew -->
  <div id="noCrewSection">
    <div class="card" style="text-align:center;padding:24px">
      <div style="font-size:40px;margin-bottom:12px">👨‍👩‍👧‍👦</div>
      <div style="font-weight:800;font-size:16px;margin-bottom:6px">Start a crew</div>
      <div style="color:var(--muted);font-size:13px;margin-bottom:20px;line-height:1.6">Create a crew, share the code with family and friends. Everyone's seat status shows here in real time.</div>
      <button class="hold-btn" onclick="createCrew()" style="font-size:16px;padding:16px">Create a Crew 🎟️</button>
    </div>
    <div class="card">
      <div class="section-label" style="margin-bottom:12px">Join someone's crew</div>
      <input class="input" id="crewCodeInput" placeholder="Enter crew code e.g. SMITH4" maxlength="12" autocomplete="off" style="margin-bottom:10px"/>
      <button class="btn" onclick="joinCrew()">Join Crew</button>
    </div>
  </div>

  <!-- In a crew -->
  <div id="inCrewSection" style="display:none">
    <div class="crew-code-display">
      <div class="crew-code-label">Your Crew Code</div>
      <div class="crew-code-value" id="crewCodeDisplay">----</div>
      <button class="btn" onclick="shareCrewCode()" style="margin:0;font-size:14px;padding:10px">Share invite link 📲</button>
    </div>
    <div style="font-size:12px;color:var(--muted);text-align:center;padding:0 12px 12px;line-height:1.6">Everyone who's holding a seat at the venue appears below. Ask your crew to tap your invite link to join.</div>
    <div id="crewList"></div>
    <button class="btn ghost" onclick="leaveCrew()" style="margin-top:8px;font-size:13px;color:var(--muted)">Leave crew</button>
  </div>

  <!-- Recent seats for crew -->
  <div id="crewSeatSection" style="display:none;margin-top:12px">
    <div class="section-label">Your recent seats</div>
    <div id="crewRecentSeats"></div>
  </div>
</div>

<!-- MATES TAB -->
<div class="view" id="v-mates">
  <h1>ACTIVE NOW</h1>
  <h2>All Seats</h2>
  <div class="sub" style="margin-bottom:16px">Everyone holding a seat right now</div>
  <div id="matesList"><div class="empty-state"><div class="empty-icon">🏟️</div>No active seats yet</div></div>
</div>

<!-- SETTINGS TAB -->
<div class="view" id="v-settings">
  <h1>SETTINGS</h1>
  <h2>Your profile</h2>
  <div class="sub" style="margin-bottom:20px">Customise your experience</div>

  <div class="card">
    <div class="section-label" style="margin-bottom:4px">Profile</div>
    <div class="setting-row" onclick="editName()">
      <div class="setting-left"><div class="setting-icon">👤</div><div><div class="setting-label">Name</div><div class="setting-desc">Shown to neighbours</div></div></div>
      <div class="setting-value" id="settingsName">Tap to set</div>
    </div>
    <div class="setting-row" style="cursor:default">
      <div class="setting-left"><div class="setting-icon">🪑</div><div><div class="setting-label">Current seat</div><div class="setting-desc" id="settingsSeat">–</div></div></div>
    </div>
    <div class="setting-row" onclick="editMatchCode()">
      <div class="setting-left"><div class="setting-icon" style="background:rgba(96,165,250,.12)">🎯</div><div><div class="setting-label">Crew code</div><div class="setting-desc" id="settingsCrewDesc">Not set</div></div></div>
      <div class="setting-value">Edit</div>
    </div>
    <div class="setting-row" style="cursor:default">
      <div class="setting-left"><div class="setting-icon" style="background:rgba(74,222,128,.12)">✉️</div><div><div class="setting-label">Account</div><div class="setting-desc" id="settingsEmail">—</div></div></div>
    </div>
    <div class="setting-row" onclick="signOut()">
      <div class="setting-left"><div class="setting-icon" style="background:rgba(239,68,68,.12)">🚪</div><div><div class="setting-label" style="color:#ef4444">Sign out</div><div class="setting-desc">You'll need the email + PIN to get back in</div></div></div>
    </div>
  </div>

  <div class="card">
    <div class="section-label" style="margin-bottom:4px">Preferences</div>
    <div class="setting-row">
      <div class="setting-left"><div class="setting-icon">🔊</div><div><div class="setting-label">Sound effects</div><div class="setting-desc">Plays on actions</div></div></div>
      <button class="toggle on" id="toggleSound" onclick="toggleSetting('sound')"></button>
    </div>
    <div class="setting-row">
      <div class="setting-left"><div class="setting-icon">📳</div><div><div class="setting-label">Haptic feedback</div><div class="setting-desc">Vibrate on tap</div></div></div>
      <button class="toggle on" id="toggleHaptic" onclick="toggleSetting('haptic')"></button>
    </div>
    <div class="setting-row">
      <div class="setting-left"><div class="setting-icon">🎊</div><div><div class="setting-label">Confetti</div><div class="setting-desc">Celebration effects</div></div></div>
      <button class="toggle on" id="toggleConfetti" onclick="toggleSetting('confetti')"></button>
    </div>
  </div>

  <div class="card">
    <div class="section-label" style="margin-bottom:4px">Notifications</div>
    <div class="setting-row" id="notifRow" onclick="toggleNotif()">
      <div class="setting-left"><div class="setting-icon" style="background:rgba(96,165,250,.12)">🔔</div><div><div class="setting-label">Expiry alerts</div><div class="setting-desc">Alert 5 min before your seat expires</div></div></div>
      <button class="toggle" id="toggleNotif" onclick="event.stopPropagation();toggleNotif()"></button>
    </div>
  </div>

  <div class="card">
    <div class="section-label" style="margin-bottom:4px">Share &amp; QR Code</div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:10px">Send your live seat link or scan the QR code</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="flex:1;font-size:12px;color:var(--muted);word-break:break-all" id="shareUrlText"></div>
      <button class="btn ghost" onclick="copyLink()" style="margin:0;padding:10px 14px;font-size:13px;width:auto;flex-shrink:0">Copy</button>
    </div>
    <button class="btn" id="nativeShareBtn" onclick="nativeShare()" style="display:none;margin-bottom:10px;font-size:14px;padding:12px">Share 📲</button>
    <div style="display:flex;justify-content:center;padding:8px 0">
      <div id="qrCode" style="background:#fff;padding:12px;border-radius:12px;display:inline-block"></div>
    </div>
    <div style="text-align:center;font-size:11px;color:var(--muted);margin-top:6px">Scan to see this seat's live status</div>
  </div>
</div>

</div><!-- end swipe-track -->
</div><!-- end swipe-container -->

<!-- NAV -->
<nav class="nav" id="nav">
  <div class="nav-indicator" id="navIndicator"></div>
  <button class="active" data-v="0">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    Home
  </button>
  <button data-v="1">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    Crew
  </button>
  <button data-v="2">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    All Seats
  </button>
  <button data-v="3">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    Settings
  </button>
</nav>

<script>
// ─── SUPABASE ───────────────────────────────────────────────────────────────
var SUPA_URL="https://huvfgenbcaiicatvtxak.supabase.co",SUPA_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1dmZnZW5iY2FpaWNhdHZ0eGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTczNjIsImV4cCI6MjA5MTE5MzM2Mn0.uTgzTKYjJnkFlRUIhGfW4ODKyV24xOdKaX7lxpDuMfc";
var sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "sms_auth" }
});

// Helper for raw REST calls that need the current user's JWT.
async function authHeaders(extra){
  var s = await sb.auth.getSession();
  var tok = (s && s.data && s.data.session && s.data.session.access_token) || SUPA_KEY;
  return Object.assign({
    "apikey": SUPA_KEY,
    "Authorization": "Bearer " + tok,
    "Content-Type": "application/json"
  }, extra || {});
}
var REST = SUPA_URL + "/rest/v1/save_my_seat_holds";

// ─── STATE ──────────────────────────────────────────────────────────────────
var params=new URLSearchParams(location.search);
var MY_NAME=params.get("name")||localStorage.getItem("sms_name")||"";
var MY_ID=localStorage.getItem("sms_device");
var CREW_CODE=params.get("crew")||localStorage.getItem("sms_crew")||"";
var MY_UID = null;     // auth.uid() once logged in
var MY_EMAIL = null;   // logged-in user's email
if(!MY_ID){MY_ID="d-"+Math.random().toString(36).slice(2,10);localStorage.setItem("sms_device",MY_ID)}
if(MY_NAME)localStorage.setItem("sms_name",MY_NAME);

// Parse seat from URL or localStorage
var savedSeat=localStorage.getItem("sms_last_seat")||"M42-J-15";
var urlSeat=params.get("seat")||"";
var SEAT_ID=urlSeat||savedSeat;
var seatParts=parseSeat(SEAT_ID);

function parseSeat(id){
  var parts=id.split("-");
  if(parts.length>=3)return{bay:parts.slice(0,-2).join("-"),row:parts[parts.length-2],num:parts[parts.length-1]};
  return{bay:parts[0]||"",row:parts[1]||"",num:parts[2]||""};
}
function buildSeatId(){
  var bay=document.getElementById("bayInput").value.trim().toUpperCase();
  var row=document.getElementById("rowInput").value.trim().toUpperCase();
  var num=document.getElementById("seatNumInput").value.trim();
  if(!bay&&!row&&!num)return SEAT_ID;
  return [bay,row,num].filter(Boolean).join("-");
}

// Pre-fill seat inputs
document.getElementById("bayInput").value=seatParts.bay;
document.getElementById("rowInput").value=seatParts.row;
document.getElementById("seatNumInput").value=seatParts.num;
document.getElementById("nameInput").value=MY_NAME;
document.getElementById("settingsName").textContent=MY_NAME||"Tap to set";
document.getElementById("settingsSeat").textContent=SEAT_ID;
document.getElementById("settingsCrewDesc").textContent=CREW_CODE||"Not set";

// Seat input listeners (update SEAT_ID live)
["bayInput","rowInput","seatNumInput"].forEach(function(id){
  document.getElementById(id).addEventListener("input",function(){
    SEAT_ID=buildSeatId();
    updateShareUrl();
    document.getElementById("kvSeat").textContent=SEAT_ID;
    document.getElementById("settingsSeat").textContent=SEAT_ID;
    localStorage.setItem("sms_last_seat",SEAT_ID);
  });
});
document.getElementById("nameInput").addEventListener("input",function(e){
  MY_NAME=e.target.value.trim();
  if(MY_NAME){localStorage.setItem("sms_name",MY_NAME);document.getElementById("settingsName").textContent=MY_NAME}
});

// Auto-join crew from URL
if(params.get("crew")&&params.get("crew")!==CREW_CODE){
  CREW_CODE=params.get("crew");
  localStorage.setItem("sms_crew",CREW_CODE);
  toast("👥","Crew joined!","Welcome to crew "+CREW_CODE);
}

var shareUrl="";
if(navigator.share)document.getElementById("nativeShareBtn").style.display="block";

// ─── SETTINGS ───────────────────────────────────────────────────────────────
var prefs={sound:true,haptic:true,confetti:true};
try{var sp=JSON.parse(localStorage.getItem("sms_prefs"));if(sp)prefs=Object.assign(prefs,sp)}catch(e){}
function savePrefs(){localStorage.setItem("sms_prefs",JSON.stringify(prefs))}
function toggleSetting(k){prefs[k]=!prefs[k];savePrefs();var el=document.getElementById("toggle"+k.charAt(0).toUpperCase()+k.slice(1));if(el){if(prefs[k])el.classList.add("on");else el.classList.remove("on")}}
function initToggles(){["sound","haptic","confetti"].forEach(function(k){var el=document.getElementById("toggle"+k.charAt(0).toUpperCase()+k.slice(1));if(el){if(prefs[k])el.classList.add("on");else el.classList.remove("on")}})}
initToggles();

// ─── RECENT SEATS ────────────────────────────────────────────────────────────
function getRecent(){try{return JSON.parse(localStorage.getItem("sms_recent"))||[]}catch(e){return[]}}
function addRecent(id){var l=getRecent().filter(function(s){return s!==id});l.unshift(id);if(l.length>5)l=l.slice(0,5);localStorage.setItem("sms_recent",JSON.stringify(l));renderRecent()}
function renderRecent(){
  var list=getRecent();
  var wrap=document.getElementById("recentSeatsWrap");
  var cont=document.getElementById("recentSeats");
  var crewCont=document.getElementById("crewRecentSeats");
  var crewSec=document.getElementById("crewSeatSection");
  if(!list.length){wrap.style.display="none";if(crewSec)crewSec.style.display="none";return}
  wrap.style.display="block";
  if(crewSec)crewSec.style.display="block";
  [cont,crewCont].forEach(function(c){if(!c)return;c.innerHTML="";list.forEach(function(s){var chip=document.createElement("span");chip.className="recent-chip";chip.innerHTML="🪑 "+s;chip.onclick=function(){location.href="/?seat="+encodeURIComponent(s)+(CREW_CODE?"&crew="+encodeURIComponent(CREW_CODE):"")};c.appendChild(chip)})});
}
addRecent(SEAT_ID);

// ─── AUTH (email + 6-digit PIN via Supabase) ─────────────────────────────────
var PENDING_EMAIL = null;
function $(id){return document.getElementById(id)}

function showLogin(){
  $("loginOverlay").classList.add("show");
  $("loginStep1").style.display="flex";
  $("loginStep2").style.display="none";
  $("loginErr1").textContent="";
  $("loginErr2").textContent="";
  setTimeout(function(){$("loginEmail").focus()},100);
}
function hideLogin(){$("loginOverlay").classList.remove("show")}
function dismissSplash(){
  localStorage.setItem("sms_seen_splash","1");
  document.getElementById("splashOverlay").classList.add("hidden");
  showLogin();
}


async function sendPin(){
  var e = $("loginEmail").value.trim().toLowerCase();
  var err = $("loginErr1");
  err.textContent="";
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e)){err.textContent="Enter a valid email";return}
  var btn = $("sendPinBtn");
  btn.disabled=true; btn.textContent="Sending…";
  try{
    var r = await sb.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true }});
    if(r.error) throw r.error;
    PENDING_EMAIL = e;
    $("loginEmailEcho").textContent = e;
    clearPin();
    $("loginStep1").style.display="none";
    $("loginStep2").style.display="flex";
    setTimeout(function(){ document.querySelector('.pin-box[data-i="0"]').focus() },100);
  }catch(ex){
    err.textContent = (ex && ex.message) ? ex.message : "Couldn't send PIN — try again";
  }finally{
    btn.disabled=false; btn.textContent="Send PIN";
  }
}

function readPin(){
  return Array.prototype.map.call(document.querySelectorAll(".pin-box"),function(b){return b.value}).join("");
}
function clearPin(){document.querySelectorAll(".pin-box").forEach(function(b){b.value=""});var f=document.querySelector('.pin-box[data-i="0"]');if(f)f.focus()}

async function verifyPin(){
  var pin = readPin();
  var err = $("loginErr2");
  err.textContent="";
  if(pin.length!==6){err.textContent="Enter all 6 digits";return}
  if(!PENDING_EMAIL){err.textContent="Start over from email";return}
  var btn = $("verifyPinBtn");
  btn.disabled=true; btn.textContent="Verifying…";
  try{
    var r = await sb.auth.verifyOtp({ email: PENDING_EMAIL, token: pin, type: "email" });
    if(r.error) throw r.error;
    // Signed in — onAuthStateChange below takes over.
    hideLogin();
  }catch(ex){
    err.textContent = (ex && ex.message) ? ex.message : "Wrong PIN — try again";
    clearPin();
  }finally{
    btn.disabled=false; btn.textContent="Verify PIN";
  }
}

async function resendPin(){
  if(!PENDING_EMAIL){changeEmail();return}
  var err = $("loginErr2"); err.textContent="";
  try{
    var r = await sb.auth.signInWithOtp({ email: PENDING_EMAIL, options: { shouldCreateUser: true }});
    if(r.error) throw r.error;
    err.style.color="var(--green)"; err.textContent="New PIN sent"; setTimeout(function(){err.style.color="";err.textContent=""},2500);
  }catch(ex){
    err.textContent = (ex && ex.message) ? ex.message : "Resend failed";
  }
}
function changeEmail(){
  PENDING_EMAIL=null;
  clearPin();
  $("loginStep2").style.display="none";
  $("loginStep1").style.display="flex";
  $("loginErr1").textContent="";
  $("loginErr2").textContent="";
  setTimeout(function(){$("loginEmail").focus()},100);
}

// PIN-box UX: auto-advance, paste-fill, backspace-back, Enter-to-submit
document.querySelectorAll(".pin-box").forEach(function(box,idx,all){
  box.addEventListener("input",function(e){
    var v = box.value.replace(/\\D/g,"");
    if(v.length>1){
      // paste of the full PIN into one box
      for(var i=0;i<v.length&&idx+i<all.length;i++) all[idx+i].value = v[i];
      var nextIdx = Math.min(all.length-1, idx+v.length);
      all[nextIdx].focus();
      if(readPin().length===6) verifyPin();
      return;
    }
    box.value = v;
    if(v && idx<all.length-1) all[idx+1].focus();
    if(readPin().length===6) verifyPin();
  });
  box.addEventListener("keydown",function(e){
    if(e.key==="Backspace" && !box.value && idx>0){ all[idx-1].focus(); }
    if(e.key==="Enter") verifyPin();
  });
});

async function signOut(){
  try{ await sb.auth.signOut(); }catch(e){}
  // Keep localStorage name/crew for next login convenience; just wipe the session.
  location.reload();
}

// After a login, sync profile + migrate anonymous holds onto this account.
async function onLoggedIn(user){
  MY_UID = user.id;
  MY_EMAIL = user.email;

  // Upsert profile
  var { data: prof } = await sb.from("user_profiles").select("*").eq("id", user.id).maybeSingle();
  if(!prof){
    // First login — seed with localStorage values if present
    await sb.from("user_profiles").insert({
      id: user.id,
      display_name: MY_NAME || null,
      crew_code: CREW_CODE || null,
      email: user.email
    });
    prof = { id:user.id, display_name:MY_NAME||null, crew_code:CREW_CODE||null, email:user.email };
  }else{
    // Pull stored profile into local state (but localStorage wins if user just typed a name)
    if(!MY_NAME && prof.display_name){ MY_NAME = prof.display_name; localStorage.setItem("sms_name", MY_NAME); }
    if(!CREW_CODE && prof.crew_code){ CREW_CODE = prof.crew_code; localStorage.setItem("sms_crew", CREW_CODE); }
  }

  // Migrate any anonymous holds from this device (holder_id = MY_ID) to this user_id
  try{
    await fetch(REST + "?holder_id=eq." + encodeURIComponent(MY_ID) + "&user_id=is.null", {
      method: "PATCH",
      headers: await authHeaders({"Prefer":"return=minimal"}),
      body: JSON.stringify({ user_id: user.id })
    });
  }catch(e){}

  // Reflect into UI
  var n = $("nameInput"); if(n){ n.value = MY_NAME||""; }
  var sn = $("settingsName"); if(sn){ sn.textContent = MY_NAME || "Tap to set"; }
  var sc = $("settingsCrewDesc"); if(sc){ sc.textContent = CREW_CODE || "Not set"; }
  var se = $("settingsEmail"); if(se){ se.textContent = user.email; }
  if(typeof renderCrewUI === "function") renderCrewUI();

  // If we still don't have a display name, show the (now post-login) onboarding
  if(!MY_NAME){ $("onboard").style.display="flex"; }

  // Kick off realtime now that we have a JWT
  if(typeof setupRealtime === "function") setupRealtime();

  // Player view: pull the current seat state into the UI
  if(typeof render === "function"){
    try{ render(await getSeat()); }catch(e){}
  }
}

// Boot: check current session. If none → show login. If present → run onLoggedIn.
(async function bootAuth(){
  var { data: { session } } = await sb.auth.getSession();
  if(session && session.user){
    document.getElementById("splashOverlay").classList.add("hidden");
    await onLoggedIn(session.user);
  } else {
    if(localStorage.getItem("sms_seen_splash")){
      document.getElementById("splashOverlay").classList.add("hidden");
      showLogin();
    }
    // else: splash stays visible; dismissSplash() calls showLogin()
  }
  // React to later auth changes (sign out, token refresh, etc.)
  sb.auth.onAuthStateChange(function(evt, sess){
    if(evt==="SIGNED_IN" && sess && sess.user){
      // Guard: bootAuth already called onLoggedIn for the existing session.
      // Don't re-run for the same user (would double-insert profile, double-migrate holds).
      if(MY_UID===sess.user.id) return;
      onLoggedIn(sess.user);
    } else if(evt==="TOKEN_REFRESHED" && sess && sess.user){
      // Push the fresh JWT to the realtime channel so RLS-protected events keep flowing.
      try{ if(typeof _rtSocket!=="undefined" && _rtSocket && _rtSocket.readyState===1){
        _rtSocket.send(JSON.stringify({topic:"realtime:public:save_my_seat_holds",event:"access_token",payload:{access_token:sess.access_token},ref:"refresh"}));
      } }catch(e){}
    } else if(evt==="SIGNED_OUT"){
      MY_UID=null; MY_EMAIL=null; showLogin();
    }
  });
})();

// ─── ONBOARDING (post-login name capture) ────────────────────────────────────
function finishOnboard(){
  var n=document.getElementById("onboardName").value.trim();
  if(!n){document.getElementById("onboardName").focus();return}
  MY_NAME=n;
  localStorage.setItem("sms_name",n);
  localStorage.setItem("sms_onboarded","1");
  var ni=document.getElementById("nameInput");ni.value=n;ni.dispatchEvent(new Event("input",{bubbles:true}));
  document.getElementById("settingsName").textContent=n;
  document.getElementById("onboard").style.display="none";
  haptic("medium");
  // Persist name to profile
  if(MY_UID){ sb.from("user_profiles").update({ display_name: n, updated_at: new Date().toISOString() }).eq("id", MY_UID).then(function(){}); }
}
function skipOnboard(){localStorage.setItem("sms_onboarded","1");document.getElementById("onboard").style.display="none"}

// ─── CREW ────────────────────────────────────────────────────────────────────
function generateCrewCode(){
  var words=["HAWK","LION","BULL","SWAN","CROW","TIGER","GIANT","DEMON","BLUE","SAINT"];
  return words[Math.floor(Math.random()*words.length)]+Math.floor(10+Math.random()*90);
}
function createCrew(){
  CREW_CODE=generateCrewCode();
  localStorage.setItem("sms_crew",CREW_CODE);
  document.getElementById("settingsCrewDesc").textContent=CREW_CODE;
  renderCrewUI();
  haptic("medium");
  toast("🎉","Crew created!","Share code "+CREW_CODE+" with your mates");
}
function joinCrew(){
  var c=document.getElementById("crewCodeInput").value.trim().toUpperCase();
  if(!c){toast("❌","","Enter a crew code first");return}
  CREW_CODE=c;
  localStorage.setItem("sms_crew",CREW_CODE);
  document.getElementById("settingsCrewDesc").textContent=CREW_CODE;
  document.getElementById("crewCodeInput").value="";
  renderCrewUI();
  haptic("medium");
  toast("👥","Joined!","Now in crew "+CREW_CODE);
}
function leaveCrew(){
  CREW_CODE="";
  localStorage.removeItem("sms_crew");
  document.getElementById("settingsCrewDesc").textContent="Not set";
  renderCrewUI();
  toast("👋","Left crew","");
}
function shareCrewCode(){
  var url="https://savemyseat.au?crew="+encodeURIComponent(CREW_CODE)+"&seat="+encodeURIComponent(SEAT_ID);
  if(navigator.share){navigator.share({title:"Join my crew on Save My Seat!",text:"I'm saving my seat at the game. Join my crew to see where everyone is: "+CREW_CODE,url:url}).catch(function(){})}
  else{navigator.clipboard&&navigator.clipboard.writeText(url).then(function(){toast("📋","Crew link copied!","Share it with your mates")})}
  haptic("light");
}
function renderCrewUI(){
  document.getElementById("noCrewSection").style.display=CREW_CODE?"none":"block";
  document.getElementById("inCrewSection").style.display=CREW_CODE?"block":"none";
  document.getElementById("crewCodeDisplay").textContent=CREW_CODE||"----";
  if(CREW_CODE)loadCrewMembers();
}
renderCrewUI();

async function loadCrewMembers(){
  var list=document.getElementById("crewList");
  if(!CREW_CODE){list.innerHTML='';return}
  list.innerHTML='<div class="empty-state" style="padding:20px"><div style="font-size:24px">⏳</div></div>';
  try{
    // Filter by crew_code server-side using Supabase query param
    var url=REST+"?select=*&crew_code=eq."+encodeURIComponent(CREW_CODE);
    var r=await fetch(url,{headers:await authHeaders(),cache:"no-store"});
    var rows=await r.json();
    var active=rows.filter(function(m){return new Date(m.expires_at)>new Date()});
    if(!active.length){list.innerHTML='<div class="empty-state"><div class="empty-icon">😴</div>No crew members holding seats yet.<br>Share your crew code!</div>';return}
    list.innerHTML="";
    active.sort(function(a,b){return a.holder_id===MY_ID?-1:b.holder_id===MY_ID?1:0});
    active.forEach(function(s){
      var left=Math.max(0,new Date(s.expires_at).getTime()-Date.now());
      var isMe=s.holder_id===MY_ID;
      var initials=(s.holder_name||"?").charAt(0).toUpperCase();
      var statusClass=s.status==="away"?"away":"held";
      var statusText=s.status==="away"?"🏃 Away — "+mmss(left):"🪑 Held — "+mmss(left);
      var el=document.createElement("div");
      el.className="crew-member";
      el.innerHTML='<div class="crew-avatar">'+initials+'</div>'+
        '<div class="crew-info"><div class="crew-name">'+(s.holder_name||"Someone")+(isMe?' <span style="color:var(--muted);font-weight:400;font-size:11px">(you)</span>':'')+
        '</div><div class="crew-seat">🪑 Seat '+s.seat_id+'</div></div>'+
        '<div class="crew-status '+statusClass+'">'+statusText+'</div>';
      list.appendChild(el);
    });
  }catch(e){list.innerHTML='<div class="empty-state">Could not load</div>'}
}

// Edit crew code — go to Crew tab for consistent UX
function editMatchCode(){goToView(1)}
function editName(){var n=prompt("Your name:",MY_NAME);if(n!==null&&n.trim()){MY_NAME=n.trim();localStorage.setItem("sms_name",MY_NAME);document.getElementById("nameInput").value=MY_NAME;document.getElementById("settingsName").textContent=MY_NAME;toast("👤","Name updated","")}}

// ─── NAV ──────────────────────────────────────────────────────────────────────
var currentView=0,totalViews=4;
var track=document.getElementById("swipeTrack"),container=document.getElementById("swipeContainer");
function goToView(i){
  currentView=Math.max(0,Math.min(totalViews-1,i));
  track.style.transform="translateX("+(currentView*-100)+"%)";
  var btns=document.querySelectorAll(".nav button");
  btns.forEach(function(b){b.classList.remove("active")});
  btns[currentView].classList.add("active");
  updateIndicator(btns[currentView]);
  if(currentView===1){loadCrewMembers()}
  if(currentView===2){loadMates()}
  if(currentView===3){generateQR()}
}
var navBtns=document.querySelectorAll(".nav button"),indicator=document.getElementById("navIndicator");
function updateIndicator(btn){if(!btn)return;var r=btn.getBoundingClientRect(),navR=document.getElementById("nav").getBoundingClientRect();if(r.width===0)return;indicator.style.left=(r.left-navR.left)+"px";indicator.style.width=r.width+"px"}
navBtns.forEach(function(b){b.addEventListener("click",function(){haptic("light");goToView(parseInt(b.dataset.v))})});
setTimeout(function(){updateIndicator(navBtns[0])},100);
window.addEventListener("resize",function(){updateIndicator(navBtns[currentView])});

// Swipe
var touchStartX=0,touchStartY=0,touchDX=0,isDragging=false,isHorizontal=null;
container.addEventListener("touchstart",function(e){if(e.target.closest("input,textarea,select,button"))return;touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;touchDX=0;isDragging=false;isHorizontal=null},{passive:true});
container.addEventListener("touchmove",function(e){if(isHorizontal===false||e.target.closest("input,textarea,select,button"))return;var dx=e.touches[0].clientX-touchStartX,dy=e.touches[0].clientY-touchStartY;if(isHorizontal===null){if(Math.abs(dx)>10)isHorizontal=true;else if(Math.abs(dy)>10){isHorizontal=false;return}}if(!isHorizontal)return;e.preventDefault();touchDX=dx;if(!isDragging){isDragging=true;track.classList.add("dragging")}var pct=currentView*-100,dragPct=(dx/container.offsetWidth)*100;if((currentView===0&&dx>0)||(currentView===totalViews-1&&dx<0))dragPct*=.25;track.style.transform="translateX("+(pct+dragPct)+"%)"},{passive:false});
container.addEventListener("touchend",function(){if(!isDragging){isHorizontal=null;return}track.classList.remove("dragging");var threshold=container.offsetWidth*.2;if(touchDX<-threshold&&currentView<totalViews-1)goToView(currentView+1);else if(touchDX>threshold&&currentView>0)goToView(currentView-1);else goToView(currentView);isDragging=false;isHorizontal=null});

// ─── TOAST ───────────────────────────────────────────────────────────────────
function toast(icon,title,body){var s=document.getElementById("toastStack"),el=document.createElement("div");el.className="toast";el.innerHTML='<div class="t-icon">'+icon+'</div><div><div class="t-title">'+title+'</div>'+(body?'<div class="t-body">'+body+'</div>':'')+'</div>';s.appendChild(el);setTimeout(function(){el.classList.add("out");setTimeout(function(){el.remove()},300)},3200)}

// ─── SOUND & HAPTIC ──────────────────────────────────────────────────────────
var audioCtx=null;
function playSound(t){if(!prefs.sound)return;try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);var now=audioCtx.currentTime;if(t==="hold"){o.frequency.value=523;g.gain.value=.08;o.type="sine";o.start();o.frequency.exponentialRampToValueAtTime(784,now+.15);g.gain.exponentialRampToValueAtTime(.001,now+.3);o.stop(now+.3)}else if(t==="release"){o.frequency.value=784;g.gain.value=.06;o.type="sine";o.start();o.frequency.exponentialRampToValueAtTime(392,now+.2);g.gain.exponentialRampToValueAtTime(.001,now+.3);o.stop(now+.3)}else if(t==="away"){o.frequency.value=440;g.gain.value=.05;o.type="triangle";o.start();o.frequency.exponentialRampToValueAtTime(349,now+.2);g.gain.exponentialRampToValueAtTime(.001,now+.25);o.stop(now+.25)}else{o.frequency.value=392;g.gain.value=.08;o.type="sine";o.start();o.frequency.exponentialRampToValueAtTime(659,now+.1);g.gain.exponentialRampToValueAtTime(.001,now+.35);o.stop(now+.35)}}catch(e){}}
function haptic(s){try{navigator.vibrate&&navigator.vibrate(s==="heavy"?[30,10,30]:s==="light"?[10]:[15])}catch(e){}}

// Ripple
document.addEventListener("click",function(e){var btn=e.target.closest(".btn,.hold-btn");if(!btn)return;var r=btn.getBoundingClientRect(),d=Math.max(r.width,r.height)*2;var rip=document.createElement("span");rip.className="ripple";rip.style.cssText="width:"+d+"px;height:"+d+"px;left:"+(e.clientX-r.left-d/2)+"px;top:"+(e.clientY-r.top-d/2)+"px";btn.appendChild(rip);setTimeout(function(){rip.remove()},600)});

// ─── CONFETTI ────────────────────────────────────────────────────────────────
var cc=document.getElementById("confetti"),ctx=cc.getContext("2d"),parts=[],cRunning=false;
function resizeCC(){cc.width=window.innerWidth;cc.height=window.innerHeight}resizeCC();window.addEventListener("resize",resizeCC);
function fireConfetti(){if(!prefs.confetti)return;haptic("heavy");var colors=["#ffd23f","#ff6b35","#4ade80","#60a5fa","#f472b6","#fff"];for(var i=0;i<80;i++)parts.push({x:window.innerWidth/2+((Math.random()-.5)*100),y:window.innerHeight*.4,vx:(Math.random()-.5)*12,vy:-(Math.random()*14+6),w:Math.random()*8+4,h:Math.random()*6+3,color:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*360,rv:(Math.random()-.5)*12,life:1});if(!cRunning){cRunning=true;animC()}}
function animC(){ctx.clearRect(0,0,cc.width,cc.height);parts=parts.filter(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.rot+=p.rv;p.life-=.008;if(p.life<=0)return false;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();return true});if(parts.length>0)requestAnimationFrame(animC);else cRunning=false}

// ─── DEST / DUR PICKERS ──────────────────────────────────────────────────────
var awayDest="food",awayMins=10;
function selectDest(btn){awayDest=btn.dataset.dest;document.querySelectorAll(".dest-btn").forEach(function(b){b.classList.remove("active")});btn.classList.add("active");haptic("light")}
document.getElementById("durPicker").addEventListener("click",function(e){var btn=e.target.closest("button");if(!btn||!btn.dataset.min)return;document.querySelectorAll(".dur-btn").forEach(function(b){b.classList.remove("active")});btn.classList.add("active");awayMins=parseInt(btn.dataset.min);haptic("light")});

// ─── REST API (auth-aware) ───────────────────────────────────────────────────
async function getSeat(){try{var r=await fetch(REST+"?seat_id=eq."+encodeURIComponent(SEAT_ID),{headers:await authHeaders(),cache:"no-store"});return(await r.json())[0]||null}catch(e){return null}}
async function putHold(status,mins,dest){
  if(!MY_UID){ toast("🔒","Please log in","Log in to hold a seat"); showLogin(); throw new Error("not logged in"); }
  var now=new Date(),exp=new Date(now.getTime()+mins*60000);
  var body={seat_id:SEAT_ID,holder_name:MY_NAME||"Anonymous",holder_id:MY_ID,user_id:MY_UID,status:status,held_at:now.toISOString(),expires_at:exp.toISOString(),updated_at:now.toISOString(),destination:dest!==undefined?dest:"",crew_code:CREW_CODE||""};
  var resp=await fetch(REST+"?on_conflict=seat_id",{method:"POST",headers:await authHeaders({"Prefer":"resolution=merge-duplicates,return=representation"}),body:JSON.stringify(body)});
  if(!resp.ok)throw new Error("API "+resp.status);
  render(body);scheduleNotification(mins*60000);return body;
}
async function deleteSeat(){await fetch(REST+"?seat_id=eq."+encodeURIComponent(SEAT_ID),{method:"DELETE",headers:await authHeaders()});render(null)}

// ─── ACTIONS ─────────────────────────────────────────────────────────────────
var actionLocked=false;
function lockBtn(){if(actionLocked)return false;actionLocked=true;var b=document.getElementById("holdBtn");if(b)b.disabled=true;return true}
function unlockBtn(){actionLocked=false;var b=document.getElementById("holdBtn");if(b)b.disabled=false}

async function holdSeat(){
  if(!MY_NAME){var n=document.getElementById("nameInput").value.trim();if(!n){toast("✏️","Add your name","So neighbours know you're coming back");document.getElementById("nameInput").focus();return}MY_NAME=n;localStorage.setItem("sms_name",MY_NAME);document.getElementById("settingsName").textContent=MY_NAME}
  SEAT_ID=buildSeatId();
  if(!SEAT_ID){toast("❌","","Enter your seat details first");return}
  localStorage.setItem("sms_last_seat",SEAT_ID);
  addRecent(SEAT_ID);
  updateShareUrl();
  if(!lockBtn())return;
  try{
    var cur=await getSeat();
    if(cur&&cur.holder_id!==MY_ID&&new Date(cur.expires_at)>new Date()){toast("🚫","Seat taken","Someone else has this seat");haptic("heavy");return}
    await putHold("held",180,"");
    // Reset ring color from any previous warning state
    var _rfg=document.getElementById("ringFg");if(_rfg)_rfg.style.stroke="url(#rg)";
    var _rtm=document.getElementById("ringTime");if(_rtm)_rtm.style.color="";
    fireConfetti();playSound("hold");
    toast("✅","Seat held!","Share the link with your mates");
    // Scroll to share strip
    setTimeout(function(){document.getElementById("shareStrip").scrollIntoView({behavior:"smooth",block:"nearest"})},300);
  }catch(e){toast("❌","Error","Try again")}finally{unlockBtn()}
}
async function releaseSeat(){if(!lockBtn())return;try{haptic("medium");playSound("release");await deleteSeat();toast("👋","Released","Seat is free")}catch(e){toast("❌","Error","Try again")}finally{unlockBtn()}}
var _releaseArmed=false,_releaseTimer=null;
function confirmRelease(){
  var btns=document.querySelectorAll("[onclick*='confirmRelease']");
  if(!_releaseArmed){
    _releaseArmed=true;
    btns.forEach(function(b){b.textContent="Tap again to confirm 🙋";b.style.background="rgba(239,68,68,0.35)"});
    _releaseTimer=setTimeout(function(){_releaseArmed=false;btns.forEach(function(b){b.textContent="Release 🙋";b.style.background=""})},3000);
  } else {
    clearTimeout(_releaseTimer);_releaseArmed=false;
    btns.forEach(function(b){b.textContent="Release 🙋";b.style.background=""});
    releaseSeat();
  }
}
async function extendHold(){if(!lockBtn())return;try{haptic("light");await putHold("held",60,"");toast("⏰","Extended","1 more hour")}catch(e){toast("❌","Error","Try again")}finally{unlockBtn()}}
async function goAway(){if(!lockBtn())return;try{haptic("medium");playSound("away");await putHold("away",awayMins,awayDest);var dl=awayDest==="food"?"🍟 Food run":awayDest==="bar"?"🍺 Bar run":awayDest==="bathroom"?"🚽 Bathroom":"🚶 Back soon";toast(dl.split(" ")[0],dl.substring(2),awayMins+" min timer")}catch(e){toast("❌","Error","Try again")}finally{unlockBtn()}}
async function extendAway(){if(!lockBtn())return;try{var r=await getSeat();if(!r){unlockBtn();return}var left=Math.max(0,new Date(r.expires_at).getTime()-Date.now());await putHold("away",Math.ceil(left/60000)+10,r.destination||"");haptic("light");toast("⏰","+10 min","")}catch(e){toast("❌","Error","Try again")}finally{unlockBtn()}}
async function returnToSeat(){if(!lockBtn())return;try{await putHold("held",180,"");fireConfetti();playSound("hold");haptic("heavy");toast("👟","Welcome back!","Seat reclaimed")}catch(e){toast("❌","Error","Try again")}finally{unlockBtn()}}

// Share
function copyLink(){updateShareUrl();navigator.clipboard&&navigator.clipboard.writeText(shareUrl).then(function(){var btn=document.getElementById("shareCopyBtn");btn.textContent="Copied!";setTimeout(function(){btn.textContent="Copy"},2000);haptic("light");toast("📋","Link copied!","Send it to your mates")})}
function nativeShare(){navigator.share&&navigator.share({title:"My seat at the game",text:MY_NAME+"'s seat — see my live status",url:shareUrl}).catch(function(){})}

// ─── MATES ────────────────────────────────────────────────────────────────────
async function loadMates(){
  var list=document.getElementById("matesList");
  list.innerHTML='<div class="empty-state"><div class="empty-icon">⏳</div>Loading...</div>';
  try{
    var r=await fetch(REST+"?select=*",{headers:await authHeaders(),cache:"no-store"});
    var rows=await r.json();
    var active=rows.filter(function(m){return new Date(m.expires_at)>new Date()});
    if(!active.length){list.innerHTML='<div class="empty-state"><div class="empty-icon">🏟️</div>No active seats yet</div>';return}
    list.innerHTML="";
    active.forEach(function(s){
      var left=Math.max(0,new Date(s.expires_at).getTime()-Date.now());
      var isMe=s.holder_id===MY_ID;
      var icon=s.status==="away"?"🏃":"🪑";
      var el=document.createElement("div");
      el.className="card";
      el.style.marginBottom="8px";
      el.innerHTML='<div style="display:flex;align-items:center;gap:12px">'+
        '<div style="font-size:26px">'+icon+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:700;font-size:14px">'+(s.holder_name||"Anonymous")+(isMe?' <span style="color:var(--accent);font-size:12px">(you)</span>':'')+'</div>'+
          '<div style="font-size:12px;color:var(--muted)">'+s.seat_id+'</div>'+
        '</div>'+
        '<div style="text-align:right;flex-shrink:0">'+
          '<div style="font-size:14px;font-weight:700;color:'+(s.status==="away"?"var(--accent2)":"var(--accent)")+'">'+mmss(left)+'</div>'+
          '<div style="font-size:11px;color:var(--muted)">'+s.status+'</div>'+
        '</div>'+
      '</div>';
      list.appendChild(el);
    });
  }catch(e){list.innerHTML='<div class="empty-state">Could not load</div>'}
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
var currentRow=null,countdownTimer=null;
var RING_CIRC=471.24;// 2*PI*75, matches stroke-dasharray
function pad2(n){return n<10?"0"+n:""+n}
function mmss(ms){if(ms<=0)return"0:00";var m=Math.floor(ms/60000),s=Math.floor((ms%60000)/1000);return m+":"+pad2(s)}
function hhmm(d){return pad2(d.getHours())+":"+pad2(d.getMinutes())}

function setTheme(c){document.getElementById("themeColor").setAttribute("content",c)}

function render(row){
  currentRow=row;
  var freeCard=document.getElementById("freeCard");
  var heldCard=document.getElementById("heldCard");
  var neighborCard=document.getElementById("neighborCard");
  var shareStrip=document.getElementById("shareStrip");
  var infoCard=document.getElementById("infoCard");
  if(document.getElementById("kvSync"))document.getElementById("kvSync").textContent=new Date().toLocaleTimeString();
  if(document.getElementById("kvSeat"))document.getElementById("kvSeat").textContent=SEAT_ID;

  var noHold=!row||!row.expires_at||new Date(row.expires_at)<=new Date();
  if(noHold){
    freeCard.style.display="block";
    heldCard.style.display="none";
    neighborCard.style.display="none";
    shareStrip.style.display="none";
    if(infoCard)infoCard.style.display="";
    document.getElementById("homeTitle").textContent="Your seat";
    setTheme("#07091a");
    document.getElementById("kvHolder").textContent="none";
    return;
  }

  var exp=new Date(row.expires_at),held=new Date(row.held_at||Date.now()),now=new Date();
  var left=Math.max(0,exp.getTime()-now.getTime());
  var total=Math.max(1,exp.getTime()-held.getTime());
  var pct=Math.min(1,(total-left)/total);

  document.getElementById("kvHolder").textContent=row.holder_name||"Anonymous";

  var isMe=row.holder_id===MY_ID;
  if(isMe){
    // My seat
    freeCard.style.display="none";
    neighborCard.style.display="none";
    heldCard.style.display="block";
    shareStrip.style.display="flex";
    if(infoCard)infoCard.style.display="";

    var dot=document.getElementById("statusDot");
    var lbl=document.getElementById("statusLabel");
    var title=document.getElementById("statusTitle");
    var heldAct=document.getElementById("heldActions");
    var awayAct=document.getElementById("awayActions");

    if(row.status==="away"){
      dot.className="dot away";
      lbl.textContent="AWAY";
      title.textContent=row.destination==="food"?"On a food run":row.destination==="bar"?"At the bar":row.destination==="bathroom"?"Bathroom break":"On your way back";
      heldAct.style.display="none";
      awayAct.style.display="block";
      document.getElementById("ringTime").className="ring-time away";
      document.getElementById("ringFg").style.stroke="var(--accent2)";
      document.getElementById("homeTitle").textContent="Back soon";
      heldCard.className="card glow-orange";
      setTheme("#ff6b35");
    } else {
      dot.className="dot held";
      lbl.textContent="HELD";
      title.textContent="Seat is saved";
      heldAct.style.display="block";
      awayAct.style.display="none";
      document.getElementById("ringTime").className="ring-time";
      document.getElementById("ringFg").style.stroke="url(#rg)";
      document.getElementById("homeTitle").textContent="Your seat";
      heldCard.className="card glow-gold";
      setTheme("#ffd23f");
    }
    // Update ring — go red when under 10 min
    var offset=RING_CIRC*(1-pct);
    document.getElementById("ringFg").style.strokeDashoffset=offset;
    document.getElementById("ringTime").textContent=mmss(left);
    document.getElementById("ringLabel").textContent="remaining";
    document.getElementById("ringEta").textContent="expires at "+hhmm(exp);
    if(left<600000){
      document.getElementById("ringFg").style.stroke="#ef4444";
      document.getElementById("ringTime").style.color="#ef4444";
    }
  } else {
    // Someone else's seat
    freeCard.style.display="none";
    heldCard.style.display="none";
    shareStrip.style.display="none";
    neighborCard.style.display="block";
    infoCard.style.display="none";
    // Stable emoji based on holder_id so it doesn't change on every render
    var emojiList=["😊","🙂","👋","😄","🤗","😎","🙌","✌️","🤙","💪"];
    var hid=row.holder_id||"";var emojiIdx=Math.abs(hid.split("").reduce(function(a,c){return a+c.charCodeAt(0)},0))%emojiList.length;
    document.getElementById("nAvatar").textContent=emojiList[emojiIdx];
    document.getElementById("nName").textContent=row.holder_name||"Someone";
    document.getElementById("nMsg").textContent=row.status==="away"?"is on their way back":"is holding this seat";
    document.getElementById("nTimer").textContent=mmss(left);
    setTheme("#07091a");
    document.getElementById("homeTitle").textContent="Occupied";
  }
}

// Live countdown
function startCountdown(){
  clearInterval(countdownTimer);
  countdownTimer=setInterval(function(){
    if(!currentRow||!currentRow.expires_at)return;
    var left=Math.max(0,new Date(currentRow.expires_at).getTime()-Date.now());
    var held=new Date(currentRow.held_at||Date.now());
    var exp=new Date(currentRow.expires_at);
    var total=Math.max(1,exp.getTime()-held.getTime());
    var pct=Math.min(1,(total-left)/total);
    var rt=document.getElementById("ringTime");
    var rf=document.getElementById("ringFg");
    if(rt){rt.textContent=mmss(left);if(left<600000)rt.style.color="#ef4444";else rt.style.color=""}
    if(rf){rf.style.strokeDashoffset=RING_CIRC*(1-pct);if(left<600000)rf.style.stroke="#ef4444"}
    var nt=document.getElementById("nTimer");
    if(nt)nt.textContent=mmss(left);
    if(left<=0){getSeat().then(render)}
  },1000);
}
startCountdown();

// ─── REALTIME ─────────────────────────────────────────────────────────────────
var _realtimeStarted=false;
var _rtSocket=null;
async function setupRealtime(){
  if(_realtimeStarted)return; _realtimeStarted=true;
  try{
    var s = await sb.auth.getSession();
    var tok = (s && s.data && s.data.session && s.data.session.access_token) || SUPA_KEY;
    var ws=new WebSocket(SUPA_URL.replace("https://","wss://")+"/realtime/v1/websocket?apikey="+SUPA_KEY+"&vsn=1.0.0"); _rtSocket=ws;
    ws.onopen=function(){
      // Authenticate the socket with the user's JWT (so RLS-protected changes are delivered)
      ws.send(JSON.stringify({topic:"phoenix",event:"access_token",payload:{access_token:tok},ref:"auth"}));
      ws.send(JSON.stringify({topic:"realtime:public:save_my_seat_holds",event:"phx_join",payload:{config:{broadcast:{ack:false},presence:{key:""},postgres_changes:[{event:"*",schema:"public",table:"save_my_seat_holds"}]},access_token:tok},ref:"1"}));
    };
    ws.onmessage=function(e){try{var msg=JSON.parse(e.data);if(msg.event==="postgres_changes"&&msg.payload&&msg.payload.data){var d=msg.payload.data;if(d.type==="INSERT"||d.type==="UPDATE"){var r=d.record;if(r&&r.seat_id===SEAT_ID){render(r)}}else if(d.type==="DELETE"){var old=d.old_record;if(old&&old.seat_id===SEAT_ID){render(null)}}}else if(msg.event==="INSERT"||msg.event==="UPDATE"){var r=msg.payload&&msg.payload.record;if(r&&r.seat_id===SEAT_ID){render(r)}}else if(msg.event==="DELETE"){var old=msg.payload&&msg.payload.old_record;if(old&&old.seat_id===SEAT_ID){render(null)}}}catch(ex){}};
    ws.onclose=function(){_realtimeStarted=false;_rtSocket=null;setTimeout(setupRealtime,3000)};
    setInterval(function(){if(ws.readyState===1)ws.send(JSON.stringify({topic:"phoenix",event:"heartbeat",payload:{},ref:"hb"}))},30000);
  }catch(e){_realtimeStarted=false}
}

// ─── GPS SEAT DETECTION ──────────────────────────────────────────────────────

// Venue maps: center coords, stands with bearing arcs, row bands by distance
// Bearings measured clockwise from North (0=N, 90=E, 180=S, 270=W)
var VENUE_MAPS={
  MCG:{
    name:"MCG",center:{lat:-37.8200,lng:144.9834},
    // Each stand: id, display name, bearing start→end (clockwise), bay prefix, total bays
    stands:[
      {id:"M",label:"Members",bs:200,be:315,bays:80},
      {id:"G",label:"Great Southern",bs:110,be:200,bays:65},
      {id:"P",label:"Ponsford",bs:30,be:110,bays:60},
      {id:"N",label:"Northern",bs:315,be:390,bays:45}  // 315→30 wraps, use 390=30
    ],
    // Distance bands from centre → approximate row letter
    rowBands:[
      {max:97, rows:["A","B","C","D","E","F"]},
      {max:117,rows:["G","H","J","K","L","M"]},
      {max:140,rows:["N","P","Q","R","S"]},
      {max:999,rows:["T","U","V","W","X","Y","Z"]}
    ]
  },
  MARVEL:{
    name:"Marvel Stadium",center:{lat:-37.8165,lng:144.9477},
    stands:[
      {id:"N",label:"Northern",bs:315,be:45,bays:50},
      {id:"E",label:"Eastern",bs:45,be:135,bays:30},
      {id:"S",label:"Southern",bs:135,be:225,bays:50},
      {id:"W",label:"Western",bs:225,be:315,bays:30}
    ],
    rowBands:[
      {max:70,rows:["A","B","C","D","E"]},
      {max:90,rows:["F","G","H","J","K"]},
      {max:999,rows:["L","M","N","P","Q"]}
    ]
  },
  AAMI:{
    name:"AAMI Park",center:{lat:-37.8198,lng:144.9842},
    stands:[
      {id:"N",label:"North",bs:315,be:45,bays:28},
      {id:"E",label:"East",bs:45,be:135,bays:20},
      {id:"S",label:"South",bs:135,be:225,bays:28},
      {id:"W",label:"West",bs:225,be:315,bays:20}
    ],
    rowBands:[
      {max:60,rows:["A","B","C","D","E"]},
      {max:80,rows:["F","G","H","J"]},
      {max:999,rows:["K","L","M"]}
    ]
  },
  OPTUS:{
    name:"Optus Stadium",center:{lat:-31.9505,lng:115.8892},
    stands:[
      {id:"N",label:"Northern",bs:315,be:45,bays:55},
      {id:"E",label:"Eastern",bs:45,be:135,bays:40},
      {id:"S",label:"Southern",bs:135,be:225,bays:55},
      {id:"W",label:"Western",bs:225,be:315,bays:40}
    ],
    rowBands:[
      {max:90,rows:["A","B","C","D","E","F"]},
      {max:115,rows:["G","H","J","K","L","M"]},
      {max:999,rows:["N","P","Q","R","S"]}
    ]
  },
  GCS:{
    name:"Metricon Stadium",center:{lat:-27.9833,lng:153.3833},
    stands:[
      {id:"N",label:"Northern",bs:315,be:45,bays:40},
      {id:"E",label:"Eastern",bs:45,be:135,bays:30},
      {id:"S",label:"Southern",bs:135,be:225,bays:40},
      {id:"W",label:"Western",bs:225,be:315,bays:30}
    ],
    rowBands:[
      {max:75,rows:["A","B","C","D","E"]},
      {max:95,rows:["F","G","H","J","K"]},
      {max:999,rows:["L","M","N","P"]}
    ]
  },
  ENGIE:{
    name:"Engie Stadium",center:{lat:-33.8474,lng:151.0644},
    stands:[
      {id:"N",label:"Northern",bs:315,be:45,bays:45},
      {id:"E",label:"Eastern",bs:45,be:135,bays:35},
      {id:"S",label:"Southern",bs:135,be:225,bays:45},
      {id:"W",label:"Western",bs:225,be:315,bays:35}
    ],
    rowBands:[
      {max:80,rows:["A","B","C","D","E"]},
      {max:100,rows:["F","G","H","J","K"]},
      {max:999,rows:["L","M","N","P","Q"]}
    ]
  }
};

function gpsHaversine(lat1,lng1,lat2,lng2){var R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180,a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}

function gpsBearing(fromLat,fromLng,toLat,toLng){var dLng=(toLng-fromLng)*Math.PI/180,lat1=fromLat*Math.PI/180,lat2=toLat*Math.PI/180,y=Math.sin(dLng)*Math.cos(lat2),x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLng);return(Math.atan2(y,x)*180/Math.PI+360)%360}

function gpsAngularPos(bearing,start,end){
  // Normalise bearing within arc start→end (clockwise), return 0-1 position
  var arcEnd=end<start?end+360:end;
  var b=bearing<start?bearing+360:bearing;
  if(b>arcEnd)b-=360;
  return Math.max(0,Math.min(1,(b-start)/(arcEnd-start)));
}

function detectSeatFromCoords(lat,lng){
  // Find nearest venue
  var nearest=null,nearestDist=Infinity;
  Object.entries(VENUE_MAPS).forEach(function(e){
    var d=gpsHaversine(lat,lng,e[1].center.lat,e[1].center.lng);
    if(d<nearestDist){nearestDist=d;nearest=e[0]}
  });
  if(nearestDist>700)return null; // not at a venue
  var venue=VENUE_MAPS[nearest];
  var bearing=gpsBearing(venue.center.lat,venue.center.lng,lat,lng);
  var dist=nearestDist;

  // Find best stand by checking which arc the bearing falls in
  var best=null,bestScore=Infinity;
  venue.stands.forEach(function(s){
    var arcEnd=s.be<s.bs?s.be+360:s.be;
    var mid=((s.bs+arcEnd)/2)%360;
    var diff=Math.min(Math.abs(bearing-mid),360-Math.abs(bearing-mid));
    if(diff<bestScore){bestScore=diff;best=s}
  });
  if(!best)return null;

  // Bay: position within stand arc → bay number
  var pos=gpsAngularPos(bearing,best.bs,best.be);
  var bayNum=Math.round(1+pos*(best.bays-1));
  var bay=best.id+bayNum;

  // Row: distance from centre → row band → middle row of band
  var rowLetter="G";
  for(var i=0;i<venue.rowBands.length;i++){
    if(dist<=venue.rowBands[i].max){
      var band=venue.rowBands[i].rows;
      rowLetter=band[Math.floor(band.length/2)];
      break;
    }
  }

  return{venue:nearest,venueName:venue.name,bay:bay,standLabel:best.label,row:rowLetter,distM:Math.round(dist),accuracy:Math.round(dist<100?"±1 bay":"±2 bays")};
}

function detectMyGPSSeat(){
  var btn=document.getElementById("detectBtn");
  var lbl=document.getElementById("detectLabel");
  var icon=document.getElementById("detectIcon");
  var result=document.getElementById("gpsResult");
  if(!navigator.geolocation){toast("❌","GPS unavailable","Your browser doesn't support location");return}
  lbl.textContent="Detecting…";icon.textContent="⏳";btn.disabled=true;
  navigator.geolocation.getCurrentPosition(
    function(pos){
      btn.disabled=false;lbl.textContent="Detect my seat automatically";icon.textContent="📍";
      var detected=detectSeatFromCoords(pos.coords.latitude,pos.coords.longitude);
      if(!detected){
        toast("📍","Not at a venue","GPS works at MCG, Marvel, AAMI, Optus, GCS & Engie");
        result.style.display="none";
        return;
      }
      // Fill in bay and row
      document.getElementById("bayInput").value=detected.bay;
      document.getElementById("rowInput").value=detected.row;
      document.getElementById("seatNumInput").value="";
      document.getElementById("seatNumInput").focus();
      // Update SEAT_ID
      SEAT_ID=buildSeatId();updateShareUrl();
      document.getElementById("kvSeat").textContent=SEAT_ID;
      document.getElementById("settingsSeat").textContent=SEAT_ID;
      // Show result banner
      document.getElementById("gpsResultTitle").textContent="📍 "+detected.venueName+" — Bay "+detected.bay+", Row "+detected.row;
      document.getElementById("gpsResultSub").textContent="~"+detected.distM+"m from centre · "+detected.standLabel+" Stand · just enter your seat number 👇";
      result.style.display="block";
      haptic("medium");toast("✅","Seat detected!","Bay "+detected.bay+", Row "+detected.row+" — enter your seat number");
    },
    function(err){
      btn.disabled=false;lbl.textContent="Detect my seat automatically";icon.textContent="📍";
      var msg=err.code===1?"Location permission denied — tap to allow in browser settings":"Couldn't get location — try again";
      toast("📍","GPS failed",msg);result.style.display="none";
    },
    {enableHighAccuracy:true,timeout:8000,maximumAge:0}
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
var notifTimer=null;
var notifEnabled=localStorage.getItem("sms_notif")==="1";
function initNotifToggle(){var el=document.getElementById("toggleNotif");if(el){if(notifEnabled)el.classList.add("on");else el.classList.remove("on")}}
initNotifToggle();
function toggleNotif(){
  if(!notifEnabled&&"Notification" in window){
    Notification.requestPermission().then(function(p){
      if(p==="granted"){notifEnabled=true;localStorage.setItem("sms_notif","1");initNotifToggle();toast("🔔","Alerts on","You'll get a nudge 5 min before expiry")}
      else{toast("❌","Blocked","Enable notifications in browser settings")}
    });
  } else {
    notifEnabled=!notifEnabled;
    localStorage.setItem("sms_notif",notifEnabled?"1":"0");
    initNotifToggle();
    if(!notifEnabled){clearTimeout(notifTimer);toast("🔕","Alerts off","")}
  }
}
function scheduleNotification(msUntilExpiry){
  clearTimeout(notifTimer);
  if(!notifEnabled)return;
  var msUntilAlert=msUntilExpiry-5*60*1000;// 5 min before
  if(msUntilAlert<0)return;
  notifTimer=setTimeout(function(){
    if("Notification" in window&&Notification.permission==="granted"){
      new Notification("Save My Seat",{body:"Your seat "+SEAT_ID+" expires in 5 minutes! Tap to extend.",icon:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23ffd23f'/%3E%3Ctext x='32' y='44' text-anchor='middle' font-size='36'%3E%F0%9F%AA%91%3C/text%3E%3C/svg%3E"});
    }
    toast("⏰","Expiry soon!","Your seat expires in 5 min — extend it");
  },msUntilAlert);
}

// ─── QR CODE ──────────────────────────────────────────────────────────────────
var qrGenerated=false;
function generateQR(){
  var container=document.getElementById("qrCode");
  if(!container||qrGenerated)return;
  try{
    container.innerHTML="";
    new QRCode(container,{text:shareUrl,width:160,height:160,colorDark:"#07091a",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
    qrGenerated=true;
  }catch(e){container.innerHTML='<div style="color:var(--muted);font-size:12px">QR unavailable</div>'}
}
// Regenerate QR when seat changes
function updateShareUrl(){
  shareUrl="https://savemyseat.au?seat="+encodeURIComponent(SEAT_ID);
  var short=shareUrl.replace("https://","");
  document.getElementById("shareUrlShort").textContent=short;
  document.getElementById("shareUrlText").textContent=shareUrl;
  qrGenerated=false;// force regenerate on next visit to settings
}

// ─── VIEW MODE ────────────────────────────────────────────────────────────────
var VIEW_MODE=params.get("view")||"fan";
var ADMIN_KEY="sms2026";

function showView(id){
  ["staffView","adminView","adminLogin"].forEach(function(v){document.getElementById(v).style.display="none"});
  document.querySelector(".swipe-container").style.display="none";
  document.querySelector(".nav").style.display="none";
  document.querySelector(".toast-stack").style.zIndex="100";
  document.getElementById(id).style.display="block";
}

// ─── STAFF VIEW ───────────────────────────────────────────────────────────────
var VENUE_NAMES={M:"MCG Members",G:"MCG Great Southern",P:"MCG Ponsford",N:"MCG Northern",S:"Marvel/AAMI South",E:"Marvel/AAMI East",W:"Marvel/AAMI West"};
function inferVenue(seatId){var p=seatId.charAt(0).toUpperCase();return VENUE_NAMES[p]||"Venue";}

async function loadStaff(){
  document.getElementById("sSync").textContent="Syncing…";
  try{
    var r=await fetch(REST+"?select=*",{headers:await authHeaders(),cache:"no-store"});
    var rows=await r.json();
    var active=rows.filter(function(m){return new Date(m.expires_at)>new Date()});
    var held=active.filter(function(m){return m.status==="held"});
    var away=active.filter(function(m){return m.status==="away"});
    document.getElementById("sTotal").textContent=active.length;
    document.getElementById("sHeld").textContent=held.length;
    document.getElementById("sAway").textContent=away.length;
    document.getElementById("sSync").textContent="● "+new Date().toLocaleTimeString();
    var list=document.getElementById("staffList");
    if(!active.length){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">🏟️</div>No active holds right now</div>';return}
    list.innerHTML="";
    active.sort(function(a,b){return a.status==="away"?-1:1}).forEach(function(s){
      var left=Math.max(0,new Date(s.expires_at).getTime()-Date.now());
      var m=Math.floor(left/60000),sec=Math.floor((left%60000)/1000);
      var t=m+":"+(sec<10?"0"+sec:sec);
      var row=document.createElement("div");
      row.className="dash-table-row";
      row.innerHTML='<div style="font-size:22px">'+(s.status==="away"?"🏃":"🪑")+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:700;font-size:14px">'+(s.holder_name||"Anonymous")+'</div>'+
          '<div style="font-size:12px;color:var(--muted)">'+s.seat_id+(s.crew_code?' · Crew <strong style="color:var(--accent)">'+s.crew_code+'</strong>':'')+'</div>'+
        '</div>'+
        '<div><span class="dash-badge '+(s.status==="away"?"badge-away":"badge-held")+'">'+s.status+'</span></div>'+
        '<div style="font-weight:700;font-size:14px;min-width:52px;text-align:right;color:'+(s.status==="away"?"var(--accent2)":"var(--accent)")+'">'+t+'</div>'+
        '<button class="clear-btn" onclick="staffClear(\\''+s.seat_id+'\\')">Clear</button>';
      list.appendChild(row);
    });
  }catch(e){document.getElementById("sSync").textContent="⚠ Error";}
}

async function staffClear(seatId){
  var row=event.target.closest(".dash-table-row");
  if(row){row.style.opacity="0.4";row.style.pointerEvents="none"}
  await fetch(REST+"?seat_id=eq."+encodeURIComponent(seatId),{method:"DELETE",headers:await authHeaders()});
  setTimeout(loadStaff,500);
  toast("✅","Cleared","Seat "+seatId+" hold removed");
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
var ADMIN_VENUES=[
  {key:"MCG",icon:"🏟️",name:"MCG",prefixes:["M","G","P","N"],city:"Melbourne"},
  {key:"MARVEL",icon:"🏟️",name:"Marvel Stadium",prefixes:["S","E","W"],city:"Melbourne"},
  {key:"AAMI",icon:"🏟️",name:"AAMI Park",prefixes:["A"],city:"Melbourne"},
  {key:"OPTUS",icon:"🏟️",name:"Optus Stadium",prefixes:["O"],city:"Perth"},
  {key:"GCS",icon:"🏟️",name:"Metricon Stadium",prefixes:["C"],city:"Gold Coast"},
  {key:"ENGIE",icon:"🏟️",name:"Engie Stadium",prefixes:["B"],city:"Sydney"},
];
var _allAdminRows=[];

async function loadAdmin(){
  document.getElementById("adminLastSync").textContent="Syncing…";
  try{
    var r=await fetch(REST+"?select=*",{headers:await authHeaders(),cache:"no-store"});
    var rows=await r.json();
    _allAdminRows=rows;
    var active=rows.filter(function(m){return new Date(m.expires_at)>new Date()});
    var away=active.filter(function(m){return m.status==="away"});
    var crews=new Set(active.map(function(m){return m.crew_code}).filter(Boolean));
    var totalLeft=active.reduce(function(s,m){return s+Math.max(0,new Date(m.expires_at).getTime()-Date.now())},0);
    var avgMins=active.length?Math.round(totalLeft/active.length/60000):0;

    document.getElementById("aTotal").textContent=active.length;
    document.getElementById("aAway").textContent=away.length;
    document.getElementById("aCrews").textContent=crews.size;
    document.getElementById("aAvgTime").textContent=avgMins+"m avg";
    document.getElementById("adminLastSync").textContent="Last sync: "+new Date().toLocaleTimeString()+" · "+active.length+" holds across all venues";

    // Venue breakdown
    var vDiv=document.getElementById("adminVenues");
    vDiv.innerHTML="";
    ADMIN_VENUES.forEach(function(v){
      var venueActive=active.filter(function(m){return v.prefixes.some(function(p){return m.seat_id.toUpperCase().startsWith(p)})});
      var venueAway=venueActive.filter(function(m){return m.status==="away"});
      var vc=document.createElement("div");
      vc.className="venue-card";
      vc.innerHTML='<div class="venue-icon">'+v.icon+'</div>'+
        '<div class="venue-info"><div class="venue-name">'+v.name+'</div><div class="venue-meta">'+v.city+(venueActive.length?' · '+venueActive.map(function(m){return m.holder_name||"Anon"}).slice(0,3).join(", ")+(venueActive.length>3?" +more":""):'')+'</div></div>'+
        '<div class="venue-stats"><div class="venue-count">'+venueActive.length+'</div>'+
          (venueAway.length?'<div class="venue-away">'+venueAway.length+' away</div>':'<div style="font-size:11px;color:var(--muted)">'+(venueActive.length?"all seated":"no holds")+'</div>')+
        '</div>';
      vDiv.appendChild(vc);
    });

    // Full table
    var list=document.getElementById("adminList");
    if(!active.length){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:40px;margin-bottom:12px">🌐</div>No active holds across any venue</div>';return}
    list.innerHTML="";
    active.sort(function(a,b){return a.status==="away"?-1:1}).forEach(function(s){
      var left=Math.max(0,new Date(s.expires_at).getTime()-Date.now());
      var m=Math.floor(left/60000),sec=Math.floor((left%60000)/1000);
      var t=m+":"+(sec<10?"0"+sec:sec);
      var row=document.createElement("div");
      row.className="dash-table-row";
      row.innerHTML='<div style="font-size:20px">'+(s.status==="away"?"🏃":"🪑")+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-weight:700;font-size:14px">'+(s.holder_name||"Anonymous")+'</div>'+
          '<div style="font-size:12px;color:var(--muted)">'+s.seat_id+(s.crew_code?' · <span style="color:var(--accent)">'+s.crew_code+'</span>':'')+'</div>'+
        '</div>'+
        '<span class="dash-badge '+(s.status==="away"?"badge-away":"badge-held")+'">'+s.status+'</span>'+
        '<div style="font-weight:700;font-size:13px;min-width:52px;text-align:right;color:'+(s.status==="away"?"var(--accent2)":"var(--accent)")+'">'+t+'</div>'+
        '<button class="clear-btn" onclick="adminClear(\\''+s.seat_id+'\\')">×</button>';
      list.appendChild(row);
    });
  }catch(e){document.getElementById("adminLastSync").textContent="⚠ Error loading data";}
}

async function adminClear(seatId){
  await fetch(REST+"?seat_id=eq."+encodeURIComponent(seatId),{method:"DELETE",headers:await authHeaders()});
  toast("✅","Cleared",""+seatId);
  setTimeout(loadAdmin,500);
}

function exportCSV(){
  var active=_allAdminRows.filter(function(m){return new Date(m.expires_at)>new Date()});
  var csv=["seat_id,holder_name,status,held_at,expires_at,crew_code"].concat(
    active.map(function(s){return[s.seat_id,s.holder_name||"",s.status,s.held_at||"",s.expires_at||"",s.crew_code||""].join(",")})
  ).join("\\n");
  var a=document.createElement("a");
  a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
  a.download="savemyseat-"+new Date().toISOString().slice(0,10)+".csv";
  a.click();
  toast("📥","CSV downloaded","");
}

function checkAdminKey(){
  var k=document.getElementById("adminKeyInput").value.trim();
  if(k===ADMIN_KEY){showView("adminView");loadAdmin();setInterval(loadAdmin,60000)}
  else{toast("❌","Wrong key","");document.getElementById("adminKeyInput").value="";document.getElementById("adminKeyInput").focus()}
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
updateShareUrl();// initialise URLs now that all functions are defined
if(navigator.share)document.getElementById("nativeShareBtn").style.display="block";

if(VIEW_MODE==="staff"){
  showView("staffView");
  loadStaff();
  setInterval(loadStaff,30000);
} else if(VIEW_MODE==="admin"){
  showView("adminLogin");
  document.getElementById("adminLogin").style.display="flex";
  document.getElementById("adminKeyInput").focus();
} else {
  // Player view: initial seat load + realtime both happen inside onLoggedIn()
  // once auth completes. Nothing to do here.
}
</script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js/v8c78df7c7c0f484497ecbca7046644da1771523124516" integrity="sha512-8DS7rgIrAmghBFwoOTujcf6D9rXvH8xm8JQ1Ja01h9QX8EzXldiszufYa4IFfKdLUKTTrnSFXLDkUEOTrZQ8Qg==" data-cf-beacon='{"version":"2024.11.0","token":"522ac22e33144c3b8b140ea756b9acca","r":1,"server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}' crossorigin="anonymous"></script>
</body>
</html>
`, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Version': '12.7-splash'
      }
    });
  }
};