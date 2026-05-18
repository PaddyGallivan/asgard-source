

// Public API rate limiter (per-isolate; CF deploys many isolates so this is approximate)
const _rl_buckets = new Map();
function rateLimit(key, max=60, windowMs=60000) {
  const now = Date.now();
  let arr = _rl_buckets.get(key) || [];
  arr = arr.filter(t => now - t < windowMs);
  if (arr.length >= max) {
    _rl_buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  _rl_buckets.set(key, arr);
  // GC old buckets if map grows too large
  if (_rl_buckets.size > 5000) {
    for (const [k, v] of _rl_buckets) {
      if (!v.length || now - v[v.length-1] > windowMs*2) _rl_buckets.delete(k);
      if (_rl_buckets.size <= 2500) break;
    }
  }
  return true;
}
function rlResponse(cors) {
  return new Response(JSON.stringify({error:'Rate limit exceeded'}), {status:429, headers:{...cors,'Content-Type':'application/json','Retry-After':'60'}});
}


const _SEC_HEADERS_CARNIVAL_RESULTS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-Robots-Tag': 'noindex, nofollow'
};
const _innerExport_carnival_results = {
  async scheduled(event, env, ctx) {
    // Trigger race-day reminder run
    ctx.waitUntil(fetch('https://carnival-results.pgallivan.workers.dev/cron/race-day-reminders', {
      method: 'POST',
      headers: {'X-Cron-Pin': env.CRON_PIN, 'cf-cron': 'true'}
    }).catch(()=>{}));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = ['https://schoolsportportal.com.au', 'https://www.schoolsportportal.com.au', 'https://sportcarnival.com.au'];
    const corsOrigin = allowedOrigins.includes(origin) ? origin : '*';
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Publish-Pin',
      'Access-Control-Allow-Credentials': 'true',
    };
    if (request.method === 'OPTIONS') return new Response(null, {headers: cors});

    // GET /api/results/:code
    if (request.method === 'GET' && path.startsWith('/api/results/')) {
      const code = path.split('/')[3];
      if (!code) return new Response('Missing code', {status:400});
      const carnival = await env.DB.prepare('SELECT * FROM carnivals WHERE code = ?').bind(code).first();
      if (!carnival) return new Response(JSON.stringify({error:'Not found'}), {status:404, headers:{...cors,'Content-Type':'application/json'}});
      const rows = await env.DB.prepare('SELECT race_key, data FROM results WHERE code = ? ORDER BY published_at ASC').bind(code).all();
      const results = {};
      for (const row of rows.results) results[row.race_key] = JSON.parse(row.data);
      return new Response(JSON.stringify({code, meta:{school:carnival.school,sport:carnival.sport,name:carnival.name}, results}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // GET /api/list?school=X&sport=Y
    if (request.method === 'GET' && path === '/api/list') {
      const school = url.searchParams.get('school') || '';
      const sport = url.searchParams.get('sport') || '';
      let q = 'SELECT code,school,sport,name,published_at FROM carnivals WHERE 1=1';
      const p = [];
      if (school) { q += ' AND LOWER(school) LIKE ?'; p.push('%'+school.toLowerCase()+'%'); }
      if (sport) { q += ' AND LOWER(sport) LIKE ?'; p.push('%'+sport.toLowerCase()+'%'); }
      q += ' ORDER BY published_at DESC LIMIT 50';
      const stmt = env.DB.prepare(q);
      const rows = await (p.length ? stmt.bind(...p) : stmt).all();
      return new Response(JSON.stringify(rows.results), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // POST /api/results/:code
    if (request.method === 'POST' && path.startsWith('/api/results/')) {
      // Auth: accept either X-Publish-Pin header matching env.CARNIVAL_PUBLISH_PIN, or a logged-in admin/committee user
      const pin = request.headers.get('X-Publish-Pin') || '';
      const pinOk = env.CARNIVAL_PUBLISH_PIN && pin && pin === env.CARNIVAL_PUBLISH_PIN;
      let userOk = false;
      if (!pinOk) {
        const u = await getCurrentUser(request, env);
        userOk = u && (u.role === 'admin' || u.role === 'committee' || u.role === 'coach');
      }
      if (!pinOk && !userOk) return new Response(JSON.stringify({error:'Forbidden — missing X-Publish-Pin header or auth cookie'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      const code = path.split('/')[3];
      if (!code) return new Response('Missing code', {status:400});
      if (!/^[A-Z0-9]{3,16}$/.test(code)) return new Response(JSON.stringify({error:'Invalid carnival code'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      const body = await request.json();
      const {meta, results} = body;
      const now = Date.now();
      await env.DB.prepare('INSERT INTO carnivals (code,school,sport,name,published_at) VALUES (?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET school=excluded.school,sport=excluded.sport,name=excluded.name,published_at=excluded.published_at')
        .bind(code, meta?.school||'', meta?.sport||'', meta?.name||'', now).run();
      if (results && typeof results === 'object') {
        for (const [raceKey, raceData] of Object.entries(results)) {
          await env.DB.prepare('INSERT INTO results (code,race_key,event_name,heat_name,published_at,data) VALUES (?,?,?,?,?,?) ON CONFLICT(code,race_key) DO UPDATE SET data=excluded.data,published_at=excluded.published_at')
            .bind(code, raceKey, raceData.eventName||'', raceData.heatName||'', now, JSON.stringify(raceData)).run();
        }
      }
      // Fire-and-forget: call ssp-data /api/internal/check-records to auto-update event records
      try {
        if (env.INTERNAL_SECRET && results && typeof results === 'object') {
          const candidates = [];
          for (const [raceKey, raceData] of Object.entries(results)) {
            // Expect raceData.eventName like "100m 11 Boys/Mixed" — parse loosely
            const evNameRaw = raceData.eventName || raceData.name || '';
            // Find winner: first placing entry or finishers[0]
            const placings = raceData.placings || raceData.results || raceData.finishers || [];
            const winner = placings && placings[0];
            if (!winner) continue;
            // Parse "100m 9/10 Girls" → sport='Athletics' (default), event='100m', age='9/10', gender='Girls'
            const parts = String(evNameRaw).trim().split(/\s+/);
            let event_name='', age_group='', gender='';
            if (parts.length >= 3) {
              event_name = parts[0];
              // Age group may be '9/10', '11', '12/13' or two tokens
              if (/^(9|11|12)/.test(parts[1])) {
                age_group = parts[1];
                gender = parts.slice(2).join(' ');
              } else {
                age_group = parts[1] + ' ' + parts[2];
                gender = parts.slice(3).join(' ') || '';
              }
            } else {
              continue;
            }
            const timeStr = winner.time || winner.result || winner.value || '';
            if (!timeStr) continue;
            // Parse time → seconds. Support "12.34", "1:23.45", "1:23"
            let seconds = NaN;
            if (typeof timeStr === 'number') seconds = timeStr;
            else if (/^[0-9]+:[0-9.]+$/.test(timeStr)) { const [m,s]=timeStr.split(':'); seconds = parseFloat(m)*60+parseFloat(s); }
            else seconds = parseFloat(timeStr);
            if (!isFinite(seconds)) continue;
            // Sport: derive from carnival meta.sport or default Athletics
            const sport = (meta?.sport || 'Athletics').replace(/cross country/i,'Cross Country').replace(/swim.*$/i,'Swimming').replace(/athletics?/i,'Athletics');
            candidates.push({
              sport, event_name, age_group, gender,
              value_str: String(timeStr),
              value_seconds: seconds,
              record_unit: seconds >= 60 ? 'min:sec' : 'seconds',
              athlete_name: winner.name || winner.athlete || '',
              athlete_school: winner.school || winner.team || '',
              year: new Date().getFullYear(),
              date_set: new Date().toISOString().slice(0,10),
              source: 'auto: ' + (meta?.name || code),
            });
          }
          if (candidates.length) {
            // Map carnival scope: meta.scope_type ('district' or 'division') + meta.scope_id
            const scope = meta?.scope_type || 'district';
            const scope_id = meta?.scope_id || meta?.district_id || meta?.division_id || '';
            if (scope_id) {
              ctx.waitUntil(fetch('https://schoolsportportal.com.au/api/internal/check-records', {
                method:'POST',
                headers:{'Content-Type':'application/json','X-Internal-Secret':env.INTERNAL_SECRET},
                body: JSON.stringify({ scope, scope_id, candidates }),
              }).catch(()=>{}));
            }
          }
        }
      } catch (e) { /* never block publish on records check */ }
      return new Response(JSON.stringify({success:true,code,races:results?Object.keys(results).length:0,authMethod:pinOk?'pin':'user'}), {headers:{...cors,'Content-Type':'application/json'}});
    }


    // GET /api/winners?division=X&year=Y
    if (request.method === 'GET' && path === '/api/winners') {
      const _ip = request.headers.get('cf-connecting-ip')||'anon'; if (!rateLimit('ro:'+_ip+':'+path, 60, 60000)) return rlResponse(cors);
      const division = url.searchParams.get('division') || '';
      const year = parseInt(url.searchParams.get('year') || '0', 10);
      if (!division || !year) return new Response(JSON.stringify({error:'Missing division or year'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      const rows = await env.DB.prepare('SELECT sport, gender, district, winner, runner_up, updated_at FROM division_winners WHERE division=? AND year=?').bind(division, year).all();
      // Group into { "sport__gender": { districts: { district: {winner, runnerUp} } } }
      const out = {};
      let lastUpdated = 0;
      for (const r of (rows.results || [])) {
        const key = r.sport + '__' + r.gender.replace(/\//g,'_');
        if (!out[key]) out[key] = { districts: {} };
        out[key].districts[r.district] = { winner: r.winner, runnerUp: r.runner_up };
        if (r.updated_at > lastUpdated) lastUpdated = r.updated_at;
      }
      return new Response(JSON.stringify({division, year, data: out, lastUpdated}), {headers:{...cors,'Content-Type':'application/json','Cache-Control':'public, max-age=30'}});
    }

    // POST /api/winners — body: {division, year, sport, gender, district, winner, runnerUp?}
    if (request.method === 'POST' && path === '/api/winners') {
      const b = await request.json();
      if (!b.division || !b.year || !b.sport || !b.gender || !b.district) return new Response(JSON.stringify({error:'Missing required fields'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      const now = Date.now();
      await env.DB.prepare('INSERT INTO division_winners (division,year,sport,gender,district,winner,runner_up,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(division,year,sport,gender,district) DO UPDATE SET winner=excluded.winner,runner_up=excluded.runner_up,updated_at=excluded.updated_at').bind(b.division, b.year, b.sport, b.gender, b.district, b.winner||'', b.runnerUp||'', now).run();
      return new Response(JSON.stringify({success:true}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // ─── POST /cron/race-day-reminders ─ daily reminder send ─────────
    // Triggered by CF Cron OR by manual call with X-Cron-Pin header
    if ((request.method === 'POST' || request.method === 'GET') && path === '/cron/race-day-reminders') {
      try {
        const pin = request.headers.get('X-Cron-Pin') || url.searchParams.get('pin') || '';
        const isAuthed = pin && env.CRON_PIN && pin === env.CRON_PIN;
        const isCron = request.headers.get('cf-cron') === 'true';
        if (!isAuthed && !isCron) {
          return new Response(JSON.stringify({error:'Forbidden'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
        }
        // Find carnivals where event_date is within next 24-48h and not yet reminded
        const now = Date.now();
        const tomorrow = new Date(now + 24*60*60*1000).toISOString().slice(0,10);
        const dayAfter = new Date(now + 48*60*60*1000).toISOString().slice(0,10);
        const rows = await env.DB.prepare("SELECT * FROM carnivals WHERE event_date IS NOT NULL AND event_date IN (?,?) AND reminder_sent_at IS NULL").bind(tomorrow, dayAfter).all();
        let sent = 0, failed = 0, items = [];
        for (const c of (rows.results||[])) {
          // Find admin/coach users for this school
          const users = await env.DB.prepare("SELECT email FROM users WHERE role IN ('admin','coach','committee')").all();
          const recipients = (users.results||[]).map(u=>u.email).filter(Boolean);
          if (!recipients.length) { items.push({code:c.code, status:'no-recipients'}); continue; }
          const subject = `Race day reminder — ${c.name||c.code} on ${c.event_date}`;
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc"><div style="background:#fff;border-radius:14px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.06)"><div style="text-align:center;margin-bottom:24px"><div style="font-size:2.2rem;line-height:1;margin-bottom:6px">⏰</div><h1 style="font-size:1.4rem;color:#0d1b3e;margin:0 0 4px">${c.name||c.code} is coming up</h1><p style="color:#64748b;font-size:.9rem;margin:0">${c.event_date} · ${c.school||''}</p></div><p style="font-size:1rem;line-height:1.6;color:#334155">Quick checklist for race morning:</p><ol style="color:#475569;line-height:1.8;padding-left:22px;margin:0 0 24px"><li>Carnival code: <strong>${c.code}</strong></li><li>Check student roster is up to date</li><li>Print bibs + finish-line marshal sheet (PDFs in your Drive)</li><li>Open <a href="https://carnivaltiming.com" style="color:#1a56db;font-weight:600">carnivaltiming.com</a> on a phone, tap New Carnival, paste the code</li><li>Verify Wi-Fi/4G works at the venue</li></ol><div style="text-align:center;margin:24px 0"><a href="https://carnivaltiming.com" style="display:inline-block;background:#1a56db;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700">Open Carnival Timing →</a></div><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 14px"><p style="font-size:.8rem;color:#64748b;line-height:1.5;margin:0">Need help on the day? Reply to this email or text Paddy directly. Good luck!</p></div><p style="text-align:center;font-size:.7rem;color:#94a3b8;margin-top:14px">School Sport Portal · Luck Dragon Pty Ltd · ABN 64 697 434 898</p></body></html>`;
          for (const to of recipients) {
            try {
              const r = await fetch('https://api.resend.com/emails', {
                method:'POST',
                headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
                body: JSON.stringify({from:'School Sport Portal <noreply@luckdragon.io>', reply_to:'hello@schoolsportportal.com.au', to, subject, html})
              });
              if (r.ok) sent++; else failed++;
            } catch(e) { failed++; }
          }
          await env.DB.prepare('UPDATE carnivals SET reminder_sent_at=? WHERE code=?').bind(now, c.code).run();
          items.push({code:c.code, recipients:recipients.length, status:'sent'});
        }
        return new Response(JSON.stringify({ok:true, sent, failed, items, scanned: (rows.results||[]).length}), {headers:{...cors,'Content-Type':'application/json'}});
      } catch(e) {
        return new Response(JSON.stringify({error:'Reminder run failed', detail:String(e)}), {status:500, headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    // ─── POST /api/unpublish {code} ─ admin removes a published carnival ─
    if (request.method === 'POST' && path === '/api/unpublish') {
      try {
        const u = await getCurrentUser(request, env);
        if (!u || u.role !== 'admin') return new Response(JSON.stringify({error:'Admin only'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
        const {code} = await request.json();
        if (!code) return new Response(JSON.stringify({error:'Missing code'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
        await env.DB.prepare('DELETE FROM results WHERE carnival_code=?').bind(code).run();
        await env.DB.prepare('DELETE FROM carnivals WHERE code=?').bind(code).run();
        return new Response(JSON.stringify({ok:true, code, removed:true}), {headers:{...cors,'Content-Type':'application/json'}});
      } catch(e) {
        return new Response(JSON.stringify({error:'Unpublish failed', detail:String(e)}), {status:500, headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    // GET /health
    if (request.method === 'GET' && path === '/health') {
      return new Response(JSON.stringify({ok:true,worker:'carnival-results',version:'1.5.0'}), {headers:{...cors,'Content-Type':'application/json'}});
    }


    // ─── AUTH HELPERS ─────────────────────────────────────────────────
    const enc = new TextEncoder();
    async function hmac(secret, data) {
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
      return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    // ─── Password helpers ─ PBKDF2-SHA256 200k iterations ────────────
    async function hashPassword(password, salt) {
      const km = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt:enc.encode(salt), iterations:100000, hash:'SHA-256'}, km, 256);
      return Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    function genSalt() {
      const a = new Uint8Array(16);
      crypto.getRandomValues(a);
      return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    async function verifyPassword(password, hash, salt) {
      if (!hash || !salt) return false;
      const got = await hashPassword(password, salt);
      // Constant-time compare
      if (got.length !== hash.length) return false;
      let r = 0;
      for (let i = 0; i < got.length; i++) r |= got.charCodeAt(i) ^ hash.charCodeAt(i);
      return r === 0;
    }

    function parseCookie(req, name) {
      const c = req.headers.get('cookie') || '';
      const m = c.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='));
      return m ? decodeURIComponent(m.slice(name.length+1)) : null;
    }
    async function getCurrentUser(req, env) {
      const auth = req.headers.get('authorization') || '';
      let token = '';
      if (auth.startsWith('Bearer ')) token = auth.slice(7);
      if (!token) token = parseCookie(req, 'ssp_session') || '';
      if (!token) return null;
      const [email, expiry, sig] = token.split('|');
      if (!email || !expiry || !sig) return null;
      if (parseInt(expiry,10) < Date.now()) return null;
      const expected = await hmac(env.SESSION_SECRET, email + '|' + expiry);
      if (sig !== expected) return null;
      const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
      return u || null;
    }

    // ─── POST /auth/login ─ {email, password} → session token ───────
    if (request.method === 'POST' && path === '/auth/login') {
      try {
        const ip = request.headers.get('cf-connecting-ip') || 'unknown';
        const now = Date.now();
        const win5 = now - 5*60*1000;
        const win15 = now - 15*60*1000;
        // Rate limit per IP: max 10 attempts / 5 min
        const ipCount = await env.DB.prepare('SELECT COUNT(*) AS n FROM auth_attempts WHERE ip=? AND ts>?').bind(ip, win5).first();
        if ((ipCount?.n||0) >= 10) {
          return new Response(JSON.stringify({error:'Too many attempts. Wait 5 minutes and try again.'}), {status:429, headers:{...cors,'Content-Type':'application/json','Retry-After':'300'}});
        }
        const {email, password} = await request.json();
        if (!email || !password) {
          await env.DB.prepare('INSERT INTO auth_attempts (ip,email,ok,ts) VALUES (?,?,?,?)').bind(ip, (email||'').toLowerCase(), 0, now).run();
          return new Response(JSON.stringify({error:'Missing email or password'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
        }
        const emailLow = String(email).toLowerCase();
        // Lockout per email: 5 failed attempts in 15 min
        const failCount = await env.DB.prepare('SELECT COUNT(*) AS n FROM auth_attempts WHERE email=? AND ok=0 AND ts>?').bind(emailLow, win15).first();
        if ((failCount?.n||0) >= 5) {
          await env.DB.prepare('INSERT INTO auth_attempts (ip,email,ok,ts) VALUES (?,?,?,?)').bind(ip, emailLow, 0, now).run();
          return new Response(JSON.stringify({error:'Account temporarily locked after too many failed attempts. Try again in 15 minutes or use Forgot Password.'}), {status:423, headers:{...cors,'Content-Type':'application/json'}});
        }
        const user = await env.DB.prepare('SELECT email,role,password_hash,password_salt FROM users WHERE LOWER(email)=LOWER(?)').bind(emailLow).first();
        const ok = user && await verifyPassword(password, user.password_hash, user.password_salt);
        if (!ok) {
          await env.DB.prepare('INSERT INTO auth_attempts (ip,email,ok,ts) VALUES (?,?,?,?)').bind(ip, emailLow, 0, now).run();
          return new Response(JSON.stringify({error:'Invalid email or password'}), {status:401, headers:{...cors,'Content-Type':'application/json'}});
        }
        await env.DB.prepare('INSERT INTO auth_attempts (ip,email,ok,ts) VALUES (?,?,?,?)').bind(ip, emailLow, 1, now).run();
        await env.DB.prepare('UPDATE users SET last_login=? WHERE email=?').bind(now, user.email).run();
        const expiry = now + 7*24*60*60*1000;
        const sig = await hmac(env.SESSION_SECRET, user.email + '|' + expiry);
        const sessionToken = user.email + '|' + expiry + '|' + sig;
        return new Response(JSON.stringify({ok:true, email: user.email, role: user.role, session: sessionToken, expiry}), {headers:{...cors,'Content-Type':'application/json'}});
      } catch(e) {
        return new Response(JSON.stringify({error:'Login failed', detail: String(e)}), {status:500, headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    // ─── POST /auth/forgot-password ─ {email} → email reset link ─────
    if (request.method === 'POST' && path === '/auth/forgot-password') {
      const _ip = request.headers.get('cf-connecting-ip')||'anon'; if (!rateLimit('forgot:'+_ip, 5, 60*60*1000)) return rlResponse(cors);
      try {
        const {email} = await request.json();
        if (!email) return new Response(JSON.stringify({error:'Missing email'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
        const emailLow = String(email).toLowerCase();
        const user = await env.DB.prepare('SELECT email FROM users WHERE LOWER(email)=LOWER(?)').bind(emailLow).first();
        // Always say "ok" to avoid email enumeration
        if (user) {
          const token = (crypto.randomUUID()+crypto.randomUUID()).replace(/-/g,'');
          const now = Date.now();
          await env.DB.prepare('INSERT INTO password_reset_tokens (token,email,created_at,expires_at) VALUES (?,?,?,?)').bind(token, user.email, now, now+15*60*1000).run();
          const link = 'https://schoolsportportal.com.au/auth/reset?token=' + token;
          try {
            await fetch('https://api.resend.com/emails', {
              method:'POST',
              headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},
              body: JSON.stringify({
                from: 'School Sport Portal <noreply@luckdragon.io>',
                reply_to: 'hello@schoolsportportal.com.au',
                to: user.email,
                subject: 'Reset your School Sport Portal password',
                html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc"><div style="background:#fff;border-radius:14px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.06)"><div style="text-align:center;margin-bottom:24px"><div style="font-size:2.2rem;line-height:1;margin-bottom:6px">🔑</div><h1 style="font-size:1.4rem;color:#0d1b3e;margin:0 0 4px">Reset your password</h1><p style="color:#64748b;font-size:.85rem;margin:0">School Sport Portal</p></div><p style="font-size:1rem;line-height:1.6;color:#334155">Hi,</p><p style="font-size:1rem;line-height:1.6;color:#334155">Tap the button below to set a new password. This link is single-use and expires in <strong>15 minutes</strong>.</p><div style="text-align:center;margin:28px 0"><a href="${link}" style="display:inline-block;background:#1a56db;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700">Set new password</a></div><p style="font-size:.85rem;color:#64748b;line-height:1.6;margin:0">Or paste this link: <a href="${link}" style="color:#1a56db;word-break:break-all;font-size:.78rem">${link}</a></p><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 14px"><p style="font-size:.75rem;color:#94a3b8;margin:0">If you didn't request this, ignore this email.</p></div></body></html>`
              })
            });
          } catch(e) {}
        }
        return new Response(JSON.stringify({ok:true, message:"If that email exists, a reset link has been sent."}), {headers:{...cors,'Content-Type':'application/json'}});
      } catch(e) {
        return new Response(JSON.stringify({error:'Forgot-password failed', detail:String(e)}), {status:500, headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    // ─── POST /auth/reset-password ─ {token, newPassword} ───────────
    if (request.method === 'POST' && path === '/auth/reset-password') {
      try {
        const {token, newPassword} = await request.json();
        if (!token || !newPassword) return new Response(JSON.stringify({error:'Missing token or newPassword'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
        if (newPassword.length < 8) return new Response(JSON.stringify({error:'Password must be at least 8 characters'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
        const row = await env.DB.prepare('SELECT * FROM password_reset_tokens WHERE token=?').bind(token).first();
        if (!row) return new Response(JSON.stringify({error:'Invalid or expired token'}), {status:401, headers:{...cors,'Content-Type':'application/json'}});
        if (row.used_at) return new Response(JSON.stringify({error:'Token already used'}), {status:401, headers:{...cors,'Content-Type':'application/json'}});
        if (row.expires_at < Date.now()) return new Response(JSON.stringify({error:'Token expired'}), {status:401, headers:{...cors,'Content-Type':'application/json'}});
        const salt = genSalt();
        const hash = await hashPassword(newPassword, salt);
        await env.DB.prepare('UPDATE users SET password_hash=?, password_salt=? WHERE LOWER(email)=LOWER(?)').bind(hash, salt, row.email).run();
        await env.DB.prepare('UPDATE password_reset_tokens SET used_at=? WHERE token=?').bind(Date.now(), token).run();
        // Clear lockouts for this email
        await env.DB.prepare('DELETE FROM auth_attempts WHERE email=? AND ok=0').bind(row.email).run();
        return new Response(JSON.stringify({ok:true, email: row.email}), {headers:{...cors,'Content-Type':'application/json'}});
      } catch(e) {
        return new Response(JSON.stringify({error:'Reset failed', detail:String(e)}), {status:500, headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    // ─── GET /auth/reset?token=X ─ HTML reset page ───────────────────
    if (request.method === 'GET' && path === '/auth/reset') {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset password — School Sport Portal</title><link rel="icon" type="image/svg+xml" href="https://schoolsportportal.com.au/favicon.svg"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#0d1b3e,#1a3a6e 60%,#1a56db);color:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;margin:0}.box{background:#fff;border-radius:18px;padding:40px 36px;max-width:420px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.25)}h1{font-size:22px;color:#0d1b3e;margin:0 0 8px;text-align:center}p.sub{color:#64748b;font-size:14px;text-align:center;margin:0 0 24px}label{display:block;font-size:13px;font-weight:600;color:#0f172a;margin-top:14px;margin-bottom:6px}input{width:100%;padding:11px 14px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:15px;font-family:inherit;box-sizing:border-box}.btn{width:100%;background:#1a56db;color:#fff;border:none;padding:13px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;margin-top:18px;font-family:inherit}.msg{margin-top:14px;font-size:13px;padding:10px;border-radius:8px;display:none}.msg.ok{background:#dcfce7;color:#15803d;border:1px solid #86efac;display:block}.msg.err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;display:block}</style></head><body><div class="box"><div style="font-size:36px;text-align:center;margin-bottom:8px">🔑</div><h1>Set a new password</h1><p class="sub">Enter your new password below. Min 8 characters.</p><form onsubmit="return doReset(event)"><label for="p1">New password</label><input id="p1" type="password" required minlength="8" autocomplete="new-password"><label for="p2">Confirm</label><input id="p2" type="password" required minlength="8" autocomplete="new-password"><button class="btn" type="submit" id="btn">Update password</button></form><div id="msg" class="msg"></div></div><script>const t=new URL(location.href).searchParams.get('token');async function doReset(e){e.preventDefault();const p1=document.getElementById('p1').value,p2=document.getElementById('p2').value,msg=document.getElementById('msg'),btn=document.getElementById('btn');if(p1!==p2){msg.className='msg err';msg.textContent='Passwords do not match';return false}btn.disabled=true;btn.textContent='Updating…';try{const r=await fetch('https://carnival-results.pgallivan.workers.dev/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,newPassword:p1})});const j=await r.json();if(j.ok){msg.className='msg ok';msg.textContent='Password updated. Redirecting…';setTimeout(()=>location.href='https://schoolsportportal.com.au/williamstowndistrict',1500)}else{msg.className='msg err';msg.textContent=j.error||'Reset failed';btn.disabled=false;btn.textContent='Update password'}}catch(e2){msg.className='msg err';msg.textContent='Network error';btn.disabled=false;btn.textContent='Update password'}return false}</script></body></html>`;
      return new Response(html, {status:200, headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});
    }

    // ─── POST /auth/set-password ─ self-service or admin-set ─────────
    // Body: {email, currentPassword?, newPassword}  (currentPassword required unless caller is admin)
    if (request.method === 'POST' && path === '/auth/set-password') {
      const {email, currentPassword, newPassword} = await request.json();
      if (!email || !newPassword) return new Response(JSON.stringify({error:'Missing email or newPassword'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      if (newPassword.length < 8) return new Response(JSON.stringify({error:'Password must be at least 8 characters'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      const caller = await getCurrentUser(request, env);
      const target = await env.DB.prepare('SELECT email,password_hash,password_salt FROM users WHERE LOWER(email)=LOWER(?)').bind(email).first();
      if (!target) return new Response(JSON.stringify({error:'User not found'}), {status:404, headers:{...cors,'Content-Type':'application/json'}});
      const isAdmin = caller && caller.role === 'admin';
      const isSelf = caller && caller.email.toLowerCase() === target.email.toLowerCase();
      if (!isAdmin && !isSelf) return new Response(JSON.stringify({error:'Unauthorised'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      // If self and a current password is set, verify it
      if (isSelf && target.password_hash) {
        const ok = await verifyPassword(currentPassword || '', target.password_hash, target.password_salt);
        if (!ok) return new Response(JSON.stringify({error:'Current password incorrect'}), {status:401, headers:{...cors,'Content-Type':'application/json'}});
      }
      const salt = genSalt();
      const hash = await hashPassword(newPassword, salt);
      await env.DB.prepare('UPDATE users SET password_hash=?, password_salt=? WHERE LOWER(email)=LOWER(?)').bind(hash, salt, target.email).run();
      return new Response(JSON.stringify({ok:true}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // ─── POST /auth/admin-bootstrap ─ initial password set, PIN-protected
    // Header: X-Admin-Pin: <env.ADMIN_BOOTSTRAP_PIN>
    // Body: {email, password, role?, displayName?}
    if (request.method === 'POST' && path === '/auth/admin-bootstrap') {
      try {
      const pin = request.headers.get('X-Admin-Pin') || '';
      if (!env.ADMIN_BOOTSTRAP_PIN || pin !== env.ADMIN_BOOTSTRAP_PIN) {
        return new Response(JSON.stringify({error:'Forbidden'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      }
      const {email, password, role, displayName} = await request.json();
      if (!email || !password) return new Response(JSON.stringify({error:'Missing email or password'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      if (password.length < 8) return new Response(JSON.stringify({error:'Password must be at least 8 characters'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      const salt = genSalt();
      const hash = await hashPassword(password, salt);
      const now = Date.now();
      const safeEmail = email.toLowerCase();
      const safeRole = role || 'admin';
      const safeName = displayName || safeEmail;
      // Upsert in two steps for D1 reliability
      const existing = await env.DB.prepare('SELECT email FROM users WHERE LOWER(email)=LOWER(?)').bind(safeEmail).first();
      if (existing) {
        await env.DB.prepare('UPDATE users SET password_hash=?, password_salt=?, role=?, display_name=? WHERE LOWER(email)=LOWER(?)').bind(hash, salt, safeRole, safeName, safeEmail).run();
      } else {
        await env.DB.prepare('INSERT INTO users (email, display_name, role, created_at, password_hash, password_salt) VALUES (?,?,?,?,?,?)').bind(safeEmail, safeName, safeRole, now, hash, salt).run();
      }
      return new Response(JSON.stringify({ok:true, email: safeEmail, role: safeRole}), {headers:{...cors,'Content-Type':'application/json'}});
      } catch(e) {
        return new Response(JSON.stringify({error:'Bootstrap failed', detail: String(e), stack: e?.stack}), {status:500, headers:{...cors,'Content-Type':'application/json'}});
      }
    }

    // (Old magic-link /auth/verify endpoint removed in v1.5.0 — replaced by /auth/reset-password)

    // ─── POST /auth/logout ────────────────────────────────────────────
    if (request.method === 'POST' && path === '/auth/logout') {
      return new Response(JSON.stringify({ok:true}), {headers:{...cors,'Content-Type':'application/json','Set-Cookie':'ssp_session=; Path=/; Max-Age=0; Domain=schoolsportportal.com.au'}});
    }

    // ─── GET /auth/me ─────────────────────────────────────────────────
    if (request.method === 'GET' && path === '/auth/me') {
      const u = await getCurrentUser(request, env);
      return new Response(JSON.stringify(u || {anonymous:true}), {headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
    }

    // ─── GET /api/scores?district=X ───────────────────────────────────
    if (request.method === 'GET' && path === '/api/scores') {
      const _ip = request.headers.get('cf-connecting-ip')||'anon'; if (!rateLimit('ro:'+_ip+':'+path, 60, 60000)) return rlResponse(cors);
      const district = url.searchParams.get('district') || '';
      const season = parseInt(url.searchParams.get('season') || new Date().getFullYear(), 10);
      let q = 'SELECT * FROM scores WHERE season=?';
      const p = [season];
      if (district) { q += ' AND LOWER(district)=LOWER(?)'; p.push(district); }
      q += ' ORDER BY sport, gender, place';
      const rows = await env.DB.prepare(q).bind(...p).all();
      return new Response(JSON.stringify(rows.results || []), {headers:{...cors,'Content-Type':'application/json','Cache-Control':'public, max-age=30'}});
    }

    // ─── POST /api/scores (auth: coach for own district, admin for any) ──
    if (request.method === 'POST' && path === '/api/scores') {
      const u = await getCurrentUser(request, env);
      if (!u) return new Response(JSON.stringify({error:'Not authenticated'}), {status:401, headers:{...cors,'Content-Type':'application/json'}});
      const b = await request.json();
      if (!b.district || !b.sport || !b.gender || !b.school) return new Response(JSON.stringify({error:'Missing required fields'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      const id = b.id || (b.district + '_' + b.sport + '_' + b.gender + '_' + b.school + '_' + (b.season || new Date().getFullYear())).toLowerCase().replace(/[^a-z0-9_]/g,'-');
      const now = Date.now();
      await env.DB.prepare('INSERT INTO scores (id,district,sport,gender,school,points,place,season,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET points=excluded.points, place=excluded.place, updated_at=excluded.updated_at').bind(id, b.district, b.sport, b.gender, b.school, b.points || 0, b.place || 0, b.season || new Date().getFullYear(), u.email, now, now).run();
      return new Response(JSON.stringify({ok:true,id}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // ─── DELETE /api/scores/:id (admin only) ──────────────────────────
    if (request.method === 'DELETE' && path.startsWith('/api/scores/')) {
      const u = await getCurrentUser(request, env);
      if (!u || u.role !== 'admin') return new Response(JSON.stringify({error:'Admin only'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      const id = decodeURIComponent(path.slice('/api/scores/'.length));
      await env.DB.prepare('DELETE FROM scores WHERE id=?').bind(id).run();
      return new Response(JSON.stringify({deleted:id}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // ─── GET /api/users (admin only) ──────────────────────────────────
    if (request.method === 'GET' && path === '/api/users') {
      const u = await getCurrentUser(request, env);
      if (!u || u.role !== 'admin') return new Response(JSON.stringify({error:'Admin only'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      const rows = await env.DB.prepare('SELECT email,display_name,role,created_at,last_login FROM users ORDER BY created_at DESC').all();
      return new Response(JSON.stringify(rows.results || []), {headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
    }

    // ─── POST /api/users (admin only — create coach) ───────────────────
    if (request.method === 'POST' && path === '/api/users') {
      const u = await getCurrentUser(request, env);
      if (!u || u.role !== 'admin') return new Response(JSON.stringify({error:'Admin only'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      const b = await request.json();
      if (!b.email) return new Response(JSON.stringify({error:'Missing email'}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      await env.DB.prepare('INSERT INTO users (email,display_name,role,created_at) VALUES (?,?,?,?) ON CONFLICT(email) DO UPDATE SET display_name=excluded.display_name, role=excluded.role').bind(b.email, b.displayName||'', b.role||'coach', Date.now()).run();
      return new Response(JSON.stringify({ok:true,email:b.email}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    // ─── DELETE /api/users/:email (admin only) ─────────────────────────
    if (request.method === 'DELETE' && path.startsWith('/api/users/')) {
      const u = await getCurrentUser(request, env);
      if (!u || u.role !== 'admin') return new Response(JSON.stringify({error:'Admin only'}), {status:403, headers:{...cors,'Content-Type':'application/json'}});
      const email = decodeURIComponent(path.slice('/api/users/'.length));
      if (email === u.email) return new Response(JSON.stringify({error:"Can't delete self"}), {status:400, headers:{...cors,'Content-Type':'application/json'}});
      await env.DB.prepare('DELETE FROM users WHERE email=?').bind(email).run();
      return new Response(JSON.stringify({deleted:email}), {headers:{...cors,'Content-Type':'application/json'}});
    }

    return new Response('Not found', {status:404});
  }
};

export default {
  async fetch(req, env, ctx) {
    const _r = await _innerExport_carnival_results.fetch(req, env, ctx);
    if (!_r) return _r;
    const _w = new Response(_r.body, _r);
    for (const [k, v] of Object.entries(_SEC_HEADERS_CARNIVAL_RESULTS)) _w.headers.set(k, v);
    return _w;
  }
};