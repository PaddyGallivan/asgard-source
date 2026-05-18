// ssp-auth — signin + account UI for School Sport Portal
// Bound to schoolsportportal.com.au routes: /signin, /account, /api/auth/*, /signout
// Reads/writes ssp-db.schools (id, email, password_hash 'pbkdf2:salt:hashHex')
// Sessions: HMAC-signed JWT-style cookie, HttpOnly Secure SameSite=Lax, 30-day TTL

const SESSION_DAYS = 30;
const COOKIE_NAME = 'ssp_session';

function htmlResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...extraHeaders
    }
  });
}

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders }
  });
}

// ─── Crypto: PBKDF2 verify + HMAC session signing ────────────────────────
async function pbkdf2Verify(password, storedHash) {
  // Format: pbkdf2:<saltHex>:<hashHex>
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const salt = hexToBytes(parts[1]);
  const expectedHash = hexToBytes(parts[2]);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const derivedBytes = new Uint8Array(derived);
  if (derivedBytes.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedBytes.length; i++) diff |= derivedBytes[i] ^ expectedHash[i];
  return diff === 0;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return bytesToHex(new Uint8Array(sig));
}

async function makeSessionToken(schoolId, secret) {
  const payload = JSON.stringify({ sid: schoolId, iat: Date.now(), exp: Date.now() + SESSION_DAYS * 86400000 });
  const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = await hmacSha256(secret, payloadB64);
  return payloadB64 + '.' + sig;
}

async function verifySessionToken(token, secret) {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expectedSig = await hmacSha256(secret, payloadB64);
  if (expectedSig !== sig) return null;
  try {
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const m = cookieHeader.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setSessionCookie(token) {
  return COOKIE_NAME + '=' + encodeURIComponent(token) + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=' + (SESSION_DAYS * 86400);
}

function clearSessionCookie() {
  return COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

// ─── DB ─────────────────────────────────────────────────────────────
async function lookupSchoolByEmail(env, email) {
  const stmt = env.SSP_DB.prepare('SELECT id, name, email, password_hash, account_type, suburb, state, student_count, district_id, active FROM schools WHERE email = ? AND active = 1 LIMIT 1');
  return await stmt.bind(email.toLowerCase()).first();
}

async function lookupSchoolById(env, id) {
  const stmt = env.SSP_DB.prepare('SELECT id, name, email, account_type, suburb, state, student_count, district_id, subscription_type FROM schools WHERE id = ? AND active = 1 LIMIT 1');
  return await stmt.bind(id).first();
}

async function logLoginAttempt(env, email, ip, ok) {
  try {
    await env.SSP_DB.prepare(
      'INSERT INTO login_attempts (email, ip, success, ts) VALUES (?, ?, ?, ?)'
    ).bind(email.toLowerCase(), ip, ok ? 1 : 0, Date.now()).run();
  } catch (_) { /* table may have different schema, log only */ }
}

async function countRecentFailedLogins(env, email) {
  try {
    const r = await env.SSP_DB.prepare(
      'SELECT COUNT(*) as n FROM login_attempts WHERE email = ? AND success = 0 AND ts > ?'
    ).bind(email.toLowerCase(), Date.now() - 600000).first();
    return r ? r.n : 0;
  } catch (_) { return 0; }
}

// ─── HTML ───────────────────────────────────────────────────────────
function pageShell(title, body) {
  return `<!DOCTYPE html><html lang="en-AU"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — School Sport Portal</title><style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;line-height:1.5}
.card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:440px;width:100%;padding:36px 32px}
h1{font-size:1.5rem;font-weight:800;color:#0d1b3e;margin-bottom:4px;letter-spacing:-.02em}
.sub{color:#64748b;font-size:.9rem;margin-bottom:24px}
.field{margin-bottom:16px}
label{font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748b;display:block;margin-bottom:6px}
input{width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:1rem;color:#0f172a;font-family:inherit}
input:focus{outline:none;border-color:#1a56db;box-shadow:0 0 0 3px rgba(26,86,219,.1)}
button.primary{width:100%;background:#1a56db;color:#fff;border:none;padding:14px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:6px}
button.primary:hover{background:#1e40af}
button.primary:disabled{opacity:.6;cursor:not-allowed}
.err{background:#fee2e2;border:1px solid #fecaca;color:#991b1b;padding:10px 14px;border-radius:8px;font-size:.85rem;margin-bottom:16px}
.ok{background:#dcfce7;border:1px solid #bbf7d0;color:#166534;padding:10px 14px;border-radius:8px;font-size:.85rem;margin-bottom:16px}
.foot{text-align:center;margin-top:20px;font-size:.85rem;color:#64748b}
.foot a{color:#1a56db;text-decoration:none;font-weight:600}
.brand{text-align:center;margin-bottom:24px}
.brand a{color:inherit;text-decoration:none}
.brand-name{font-size:1.2rem;font-weight:800;color:#0d1b3e;letter-spacing:-.02em}
.brand-tag{font-size:.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-top:2px}
.row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9}
.row:last-child{border-bottom:none}
.row-key{font-size:.78rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.row-val{font-size:.95rem;color:#0f172a;font-weight:500;text-align:right}
.linkbtn{background:none;border:none;color:#dc2626;font-size:.9rem;cursor:pointer;text-decoration:underline;padding:0}
</style></head><body><div class="card"><div class="brand"><a href="/"><div class="brand-name">School Sport Portal</div><div class="brand-tag">schoolsportportal.com.au</div></a></div>${body}</div></body></html>`;
}

function signinPage(error, prefillEmail) {
  const errBlock = error ? `<div class="err">${error}</div>` : '';
  return pageShell('Sign in', `
    <h1>Sign in</h1>
    <p class="sub">Sign in to manage your school's portal.</p>
    ${errBlock}
    <form method="POST" action="/api/auth/login" autocomplete="on">
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" value="${prefillEmail || ''}" required autofocus autocomplete="username">
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>
      <button class="primary" type="submit">Sign in →</button>
    </form>
    <div class="foot">
      <a href="/forgot-password">Forgot password?</a> &middot; <a href="/">Back to home</a>
    </div>
  `);
}

function accountPage(school, ownedSchools) {
  const owned = ownedSchools || [school];
  const fmtType = { school: 'School', district: 'District', division: 'Division', region: 'Region' };
  const linkFor = (s) => {
    // Canonical hierarchical URLs per account_type + school id
    const idMap = {
      // Schools
      'williamstownprimary': '/school/primary/williamstown',
      'williamstown-primary': '/school/primary/williamstown',
      // Districts
      'williamstown-district': '/district/primary/williamstown',
      'williamstowndistrict': '/district/primary/williamstown',
      // Divisions
      'hobsonsbay': '/division/primary/hobsons-bay',
      'hobsonsbay-division': '/division/primary/hobsons-bay',
      'hobsons-bay': '/division/primary/hobsons-bay',
      'wyndham': '/division/primary/wyndham',
      'wyndham-division': '/division/primary/wyndham',
      // Regions
      'wmr': '/region/wmr',
      'westernmetroregion': '/region/wmr',
    };
    if (idMap[s.id]) return idMap[s.id];
    // Fallback: build canonical URL from account_type + id
    const t = (s.account_type || '').toLowerCase();
    if (t === 'school') return '/school/primary/' + s.id;
    if (t === 'district') return '/district/primary/' + s.id.replace(/-district$/, '');
    if (t === 'division') return '/division/primary/' + s.id.replace(/-division$/, '');
    if (t === 'region') return '/region/' + s.id;
    return '/' + s.id;
  };
  const card = (s) => {
    const url = linkFor(s);
    const tag = fmtType[s.account_type] || s.account_type;
    return `<a href="${escapeHtml(url)}" target="_blank" style="display:block;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;text-decoration:none;color:#0f172a;transition:border-color .15s">
      <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#1a56db;margin-bottom:4px">${escapeHtml(tag)}</div>
      <div style="font-size:1rem;font-weight:700;margin-bottom:4px">${escapeHtml(s.name)}</div>
      <div style="font-size:.78rem;color:#64748b;font-family:Menlo,monospace">${escapeHtml(url)} &rarr;</div>
    </a>`;
  };
  return pageShell('Account', `
    <h1>Hi ${escapeHtml(school.email.split('@')[0])} 👋</h1>
    <p class="sub">You manage ${owned.length} ${owned.length === 1 ? 'page' : 'pages'} on School Sport Portal.</p>

    <div style="display:flex;flex-direction:column;gap:8px;margin:18px 0 22px">
      ${owned.map(card).join('')}
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;margin-top:18px">
      <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:10px">Account</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <a href="/billing" style="background:#0ea5e9;color:#fff;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">Manage billing</a>
        <a href="/account/change-password" style="background:#f1f5f9;color:#0f172a;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">Change password</a>
        <a href="/account/branding" style="background:#f1f5f9;color:#0f172a;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">School branding</a>
        <a href="/account/records" style="background:#f1f5f9;color:#0f172a;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">Import records</a>
        <a href="/account/calendar" style="background:#f1f5f9;color:#0f172a;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">Booking calendar</a>
        <a href="/account/sports" style="background:#f1f5f9;color:#0f172a;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">Sports & coordinators</a>
        <a href="/account/news" style="background:#f1f5f9;color:#0f172a;padding:11px 14px;border-radius:10px;text-decoration:none;font-weight:600;font-size:.88rem;text-align:center">Announcements</a>
      </div>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;margin-top:18px">
      <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:10px">Quick links</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <a href="https://carnivaltiming.com/marketing" target="_blank" style="background:#fff;border:1px solid #e2e8f0;padding:10px 12px;border-radius:8px;text-decoration:none;color:#0f172a;font-size:.85rem">🏁 Carnival Timing</a>
        <a href="https://sportcarnival.com.au" target="_blank" style="background:#fff;border:1px solid #e2e8f0;padding:10px 12px;border-radius:8px;text-decoration:none;color:#0f172a;font-size:.85rem">🏆 SportCarnival</a>
        <a href="/pricing" style="background:#fff;border:1px solid #e2e8f0;padding:10px 12px;border-radius:8px;text-decoration:none;color:#0f172a;font-size:.85rem">📋 Pricing</a>
        <a href="/privacy" style="background:#fff;border:1px solid #e2e8f0;padding:10px 12px;border-radius:8px;text-decoration:none;color:#0f172a;font-size:.85rem">🔒 Privacy</a>
      </div>
    </div>

    <div style="margin-top:24px;padding:14px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:.82rem;color:#92400e">
      <strong>Account details:</strong> ${escapeHtml(school.email)} &middot; signed in as ${escapeHtml(school.name)}
    </div>

    <div class="foot">
      <form method="POST" action="/api/auth/logout" style="display:inline">
        <button type="submit" class="linkbtn">Sign out</button>
      </form>
    </div>
  `);
}

function changePasswordPage(error, success) {
  const errBlock = error ? `<div class="err">${error}</div>` : '';
  const okBlock = success ? `<div class="ok">${success}</div>` : '';
  return pageShell('Change password', `
    <h1>Change password</h1>
    <p class="sub">Enter your current password and a new one (min 10 chars).</p>
    ${errBlock}${okBlock}
    <form method="POST" action="/api/auth/change-password" autocomplete="on">
      <div class="field"><label>Current password</label><input type="password" name="current" required autocomplete="current-password"></div>
      <div class="field"><label>New password</label><input type="password" name="new" required minlength="10" autocomplete="new-password"></div>
      <div class="field"><label>Confirm new password</label><input type="password" name="confirm" required minlength="10" autocomplete="new-password"></div>
      <button class="primary" type="submit">Change password →</button>
    </form>
    <div class="foot"><a href="/account">← Back to account</a></div>
  `);
}

function forgotPage(message) {
  const msgBlock = message ? `<div class="ok">${message}</div>` : '';
  return pageShell('Forgot password', `
    <h1>Forgot password</h1>
    <p class="sub">Enter your email and we'll send a reset link.</p>
    ${msgBlock}
    <form method="POST" action="/api/auth/forgot">
      <div class="field"><label>Email</label><input type="email" name="email" required autofocus></div>
      <button class="primary" type="submit">Send reset link →</button>
    </form>
    <div class="foot"><a href="/signin">← Back to sign in</a></div>
  `);
}

function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function buildResetEmailHtml(school, token) {
  const link = `https://schoolsportportal.com.au/reset-password?token=${token}`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset password</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.55">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0f4f8">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden">
    <tr><td style="background:linear-gradient(135deg,#0d1b3e 0%,#1a3a6e 60%,#1a56db 100%);padding:36px 24px;text-align:center;color:#fff">
      <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#fcd34d;margin-bottom:6px">School Sport Portal</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em">Reset your password</div>
    </td></tr>
    <tr><td style="padding:32px 32px 8px;font-size:15px;color:#1e293b">
      <p style="margin:0 0 14px"><strong>Hi,</strong></p>
      <p style="margin:0 0 14px">We received a request to reset the password on your School Sport Portal account.</p>
      <p style="margin:0 0 22px">Tap the button below to set a new password. The link is valid for <strong>1 hour</strong>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td align="center" style="padding:6px 0 24px">
          <a href="${link}" style="display:inline-block;background:#1a56db;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 2px 8px rgba(26,86,219,0.25)">Set a new password</a>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px">Button not working? Copy this link into your browser:</p>
      <p style="margin:0 0 22px;word-break:break-all;font-family:Menlo,Consolas,monospace;font-size:12px;color:#1a56db;background:#f1f5f9;padding:10px 12px;border-radius:6px"><a href="${link}" style="color:#1a56db;text-decoration:none">${link}</a></p>
      <p style="margin:0 0 14px;color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email &mdash; your password won't change.</p>
      <p style="margin:0;color:#64748b;font-size:13px">Need help? Just reply to this email and Paddy will sort it out.</p>
    </td></tr>
    <tr><td style="padding:24px 32px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center">
      <div style="font-weight:700;color:#0d1b3e;font-size:13px;margin-bottom:4px">School Sport Portal</div>
      <div>Live carnival timing, house points, results &amp; district qualifiers.</div>
      <div style="margin-top:10px"><a href="https://schoolsportportal.com.au" style="color:#1a56db;text-decoration:none">schoolsportportal.com.au</a> &middot; <a href="https://carnivaltiming.com" style="color:#1a56db;text-decoration:none">carnivaltiming.com</a></div>
      <div style="margin-top:16px;font-size:11px">&copy; 2026 Luck Dragon Pty Ltd &middot; ABN 64 697 434 898</div>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

// ─── PBKDF2 hash (for password change) ──────────────────────────────────
async function pbkdf2Hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2:' + bytesToHex(salt) + ':' + bytesToHex(new Uint8Array(derived));
}

// ─── Main fetch ─────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const _safeJson = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    const _safeFormData = async (r) => {
      const ct = (r.headers.get('Content-Type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        try {
          const j = await r.json();
          const fd = new FormData();
          for (const [k, v] of Object.entries(j || {})) {
            fd.append(k, String(v));
          }
          return fd;
        } catch { return new FormData(); }
      }
      try { return await r.formData(); } catch { return new FormData(); }
    };
    try {
    const url = new URL(request.url);
    const p = url.pathname.replace(/\/$/, '') || '/';
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const sessionSecret = env.SESSION_SECRET || 'CHANGE_ME_IN_PROD';

    // ─── GET /signin ────────────────────────────────────────────────────
    if (p === '/signin' && (request.method === 'GET' || request.method === 'HEAD')) {
      const existing = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (existing) return Response.redirect(new URL('/account', url.origin).toString(), 302);
      return htmlResponse(signinPage(url.searchParams.get('err'), url.searchParams.get('email') || ''));
    }

    // ─── POST /api/auth/login ───────────────────────────────────────────
    if (p === '/api/auth/login' && request.method === 'POST') {
      const fd = await _safeFormData(request);
      const email = String(fd.get('email') || '').trim().toLowerCase();
      const password = String(fd.get('password') || '');
      if (!email || !password) return Response.redirect(new URL('/signin?err=' + encodeURIComponent('Email and password required'), url.origin).toString(), 302);

      // Brute-force throttle: 5 failed attempts per email per 10 minutes
      const failures = await countRecentFailedLogins(env, email);
      if (failures >= 5) {
        await logLoginAttempt(env, email, ip, false);
        return Response.redirect(new URL('/signin?err=' + encodeURIComponent('Too many failed attempts. Try again in 10 minutes.') + '&email=' + encodeURIComponent(email), url.origin).toString(), 302);
      }

      const school = await lookupSchoolByEmail(env, email);
      if (!school || !school.password_hash) {
        await logLoginAttempt(env, email, ip, false);
        // Same error message regardless — don't leak account existence
        return Response.redirect(new URL('/signin?err=' + encodeURIComponent('Invalid email or password') + '&email=' + encodeURIComponent(email), url.origin).toString(), 302);
      }
      const ok = await pbkdf2Verify(password, school.password_hash);
      await logLoginAttempt(env, email, ip, ok);
      if (!ok) return Response.redirect(new URL('/signin?err=' + encodeURIComponent('Invalid email or password') + '&email=' + encodeURIComponent(email), url.origin).toString(), 302);

      // Update last_login (best-effort)
      try { await env.SSP_DB.prepare('UPDATE schools SET updated_at = datetime("now") WHERE id = ?').bind(school.id).run(); } catch (_) {}

      const token = await makeSessionToken(school.id, sessionSecret);
      return new Response(null, {
        status: 302,
        headers: { 'Location': new URL((url.searchParams.get('next') && /^\/[a-z0-9_\-\/]+$/i.test(url.searchParams.get('next'))) ? url.searchParams.get('next') : '/account', url.origin).toString(), 'Set-Cookie': setSessionCookie(token) }
      });
    }

    // ─── GET /account ───────────────────────────────────────────────────
    if (p === '/account' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) {
        // Friendly "please sign in" page instead of silent redirect
        return htmlResponse(pageShell('Sign in required', `
          <h1>Sign in to view your account</h1>
          <p class="sub">Your account page shows the schools, districts, and divisions you manage on School Sport Portal.</p>
          <a href="/signin?next=/account" style="display:inline-block;background:#1d4ed8;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:14px">Sign in</a>
          <div class="foot" style="margin-top:18px"><a href="/forgot-password">Forgot password?</a> &middot; <a href="/">Back to home</a></div>
        `));
      }
      const school = await lookupSchoolById(env, session.sid);
      if (!school) return new Response(null, { status: 302, headers: { 'Location': '/signin', 'Set-Cookie': clearSessionCookie() } });
      // Fetch all schools owned by this email (district, division, school, region etc.)
      const owned = await env.SSP_DB.prepare(
        'SELECT id, name, email, account_type, suburb, state, student_count, district_id FROM schools WHERE email = ? AND active = 1 ORDER BY CASE account_type WHEN \'region\' THEN 1 WHEN \'division\' THEN 2 WHEN \'district\' THEN 3 WHEN \'school\' THEN 4 ELSE 5 END, name'
      ).bind(school.email).all();
      return htmlResponse(accountPage(school, owned.results || [school]));
    }

    // ─── GET /account/change-password ───────────────────────────────────
    if (p === '/account/change-password' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/change-password', url.origin).toString(), 302);
      return htmlResponse(changePasswordPage(url.searchParams.get('err'), url.searchParams.get('ok')));
    }

    // ─── POST /api/auth/change-password ─────────────────────────────────
    if (p === '/api/auth/change-password' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const current = String(fd.get('current') || '');
      const newP = String(fd.get('new') || '');
      const confirm = String(fd.get('confirm') || '');
      if (newP.length < 10) return Response.redirect(new URL('/account/change-password?err=' + encodeURIComponent('Password must be at least 10 characters'), url.origin).toString(), 302);
      if (newP !== confirm) return Response.redirect(new URL('/account/change-password?err=' + encodeURIComponent('New passwords do not match'), url.origin).toString(), 302);
      const school = await env.SSP_DB.prepare('SELECT id, password_hash FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!school || !await pbkdf2Verify(current, school.password_hash)) {
        return Response.redirect(new URL('/account/change-password?err=' + encodeURIComponent('Current password is incorrect'), url.origin).toString(), 302);
      }
      const newHash = await pbkdf2Hash(newP);
      await env.SSP_DB.prepare('UPDATE schools SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').bind(newHash, school.id).run();

      return Response.redirect(new URL('/account/change-password?ok=' + encodeURIComponent('Password changed successfully.'), url.origin).toString(), 302);
    }

    // ─── GET /account/branding ─────────────────────────────────────────
    if (p === '/account/branding' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/branding', url.origin).toString(), 302);
      const sch = await env.SSP_DB.prepare(
        'SELECT id, name, account_type, principal, phone, suburb, founded_year, year_levels, school_motto, website_url, primary_color, secondary_color, house_colors, logo_url FROM schools WHERE id = ? AND active = 1'
      ).bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const ok = url.searchParams.get('ok');
      const err = url.searchParams.get('err');
      const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      return htmlResponse(pageShell('Branding · ' + sch.name, `
        <h1>School branding & details</h1>
        <p class="sub">Customise how your portal page looks. Coordinators only.</p>
        ${ok?`<div style="background:#dcfce7;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(ok)}</div>`:''}
        ${err?`<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(err)}</div>`:''}
        <form method="POST" action="/api/account/branding" style="display:grid;gap:14px;margin-top:18px">
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Principal name</span>
            <input type="text" name="principal" value="${esc(sch.principal)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">School phone</span>
            <input type="tel" name="phone" value="${esc(sch.phone)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Suburb</span>
            <input type="text" name="suburb" value="${esc(sch.suburb)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Year levels (e.g. P-6 or 7-12)</span>
            <input type="text" name="year_levels" value="${esc(sch.year_levels)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Founded year</span>
            <input type="number" name="founded_year" min="1800" max="2030" value="${esc(sch.founded_year)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">School motto</span>
            <input type="text" name="school_motto" value="${esc(sch.school_motto)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Website URL</span>
            <input type="url" name="website_url" placeholder="https://your-school.vic.edu.au" value="${esc(sch.website_url)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem"></label>
          <div style="display:grid;gap:8px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
            <span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Logo</span>
            ${sch.logo_url?`<img src="${esc(sch.logo_url)}" alt="current logo" style="max-width:120px;max-height:120px;border:1px solid #e2e8f0;border-radius:6px;padding:6px;background:#fff">`:'<p style="font-size:.85rem;color:#94a3b8;font-style:italic">No logo uploaded yet.</p>'}
            <input type="url" name="logo_url" placeholder="Paste a logo URL (or upload below)" value="${esc(sch.logo_url)}" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem">
            <p style="font-size:.78rem;color:#64748b">Or use the upload form on the <a href="/account/branding/upload-logo">logo upload page</a> to add a PNG/JPG directly.</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Primary color</span>
              <input type="color" name="primary_color" value="${esc(sch.primary_color||'#1a56db')}" style="height:42px;padding:3px;border:1px solid #cbd5e1;border-radius:6px"></label>
            <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Secondary color</span>
              <input type="color" name="secondary_color" value="${esc(sch.secondary_color||'#f59e0b')}" style="height:42px;padding:3px;border:1px solid #cbd5e1;border-radius:6px"></label>
          </div>
          <div style="display:grid;gap:6px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
            <span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">School houses</span>
            <p style="font-size:.78rem;color:#64748b;margin-bottom:8px">Up to 6 houses. Set the name and colour. Leave a row blank to skip it.</p>
            <div id="houses-grid" style="display:grid;gap:8px"></div>
            <input type="hidden" name="house_colors" id="house_colors_json" value="${esc(sch.house_colors)}">
            <script>
              (function(){
                const init = ${(()=>{ try { return JSON.parse(sch.house_colors||'{}'); } catch(e) { return {}; } })()};
                const grid = document.getElementById('houses-grid');
                const hidden = document.getElementById('house_colors_json');
                const palette = ['#ef4444','#10b981','#3b82f6','#f59e0b','#a855f7','#ec4899'];
                const entries = Object.entries(init||{});
                while (entries.length < 6) entries.push(['','']);
                function render(){
                  grid.innerHTML = '';
                  entries.forEach((row,i)=>{
                    const div = document.createElement('div');
                    div.style.cssText = 'display:grid;grid-template-columns:1fr 64px;gap:8px;align-items:center';
                    div.innerHTML = '<input type="text" placeholder="House '+(i+1)+' name (e.g. GEM)" data-i="'+i+'" data-k="name" value="'+(row[0]||'').replace(/\"/g,'&quot;')+'" style="padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:.9rem">'+
                      '<input type="color" data-i="'+i+'" data-k="color" value="'+(row[1]||palette[i%palette.length])+'" style="height:38px;padding:2px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer">';
                    grid.appendChild(div);
                  });
                  grid.querySelectorAll('input').forEach(el => {
                    el.addEventListener('input', ()=>{
                      const i = parseInt(el.dataset.i), k = el.dataset.k;
                      if (k==='name') entries[i][0] = el.value.trim();
                      if (k==='color') entries[i][1] = el.value;
                      const obj = {};
                      for (const [n,c] of entries) { if (n) obj[n.toUpperCase()] = c; }
                      hidden.value = JSON.stringify(obj);
                    });
                  });
                }
                render();
              })();
            </script>
          </div>
          <button type="submit" style="background:#1d4ed8;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer;width:fit-content">Save branding</button>
        </form>
        <div class="foot" style="margin-top:24px"><a href="/account">← Back to account</a></div>
      `));
    }

    // ─── POST /api/account/branding ────────────────────────────────────
    if (p === '/api/account/branding' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const get = (k, def='') => String(fd.get(k) || def).trim();
      const principal = get('principal');
      const phone = get('phone');
      const suburb = get('suburb');
      const year_levels = get('year_levels');
      const founded_year = parseInt(get('founded_year','0')) || null;
      const school_motto = get('school_motto');
      const website_url = get('website_url');
      const logo_url = get('logo_url');
      const primary_color = get('primary_color') || '#1a56db';
      const secondary_color = get('secondary_color') || '#f59e0b';
      let house_colors = get('house_colors');
      if (house_colors) {
        try { JSON.parse(house_colors); } catch (e) {
          return Response.redirect(new URL('/account/branding?err=' + encodeURIComponent('House colors must be valid JSON'), url.origin).toString(), 302);
        }
      }
      try {
        await env.SSP_DB.prepare(
          'UPDATE schools SET principal=?, phone=?, suburb=?, year_levels=?, founded_year=?, school_motto=?, website_url=?, logo_url=?, primary_color=?, secondary_color=?, house_colors=?, updated_at=datetime("now") WHERE id = ?'
        ).bind(principal, phone, suburb, year_levels, founded_year, school_motto, website_url, logo_url, primary_color, secondary_color, house_colors, session.sid).run();
      } catch (e) {
        return Response.redirect(new URL('/account/branding?err=' + encodeURIComponent('Save failed: ' + e.message), url.origin).toString(), 302);
      }
      return Response.redirect(new URL('/account/branding?ok=' + encodeURIComponent('Branding saved.'), url.origin).toString(), 302);
    }

    // ─── GET /account/branding/upload-logo ─────────────────────────────
    if (p === '/account/branding/upload-logo' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/branding/upload-logo', url.origin).toString(), 302);
      const sch = await env.SSP_DB.prepare('SELECT id, name, logo_url FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const ok = url.searchParams.get('ok');
      const err = url.searchParams.get('err');
      const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      return htmlResponse(pageShell('Upload logo · ' + sch.name, `
        <h1>Upload school logo</h1>
        <p class="sub">PNG, JPG or SVG up to 500KB. Recommended size 400×400 px. Logo appears on your school portal page header.</p>
        ${ok?`<div style="background:#dcfce7;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(ok)}</div>`:''}
        ${err?`<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(err)}</div>`:''}
        ${sch.logo_url?`<div style="margin:14px 0"><img src="${esc(sch.logo_url)}" style="max-width:180px;max-height:180px;border:1px solid #e2e8f0;border-radius:8px;padding:8px;background:#fff" alt="current logo"></div>`:''}
        <form method="POST" action="/api/account/branding/upload-logo" enctype="multipart/form-data" style="display:grid;gap:14px;margin-top:14px">
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Logo file (max 500KB)</span>
            <input type="file" name="logo" accept="image/png,image/jpeg,image/svg+xml" required style="padding:9px 11px;border:1px dashed #cbd5e1;border-radius:6px;background:#fff"></label>
          <button type="submit" style="background:#1d4ed8;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;cursor:pointer;width:fit-content">Upload logo</button>
        </form>
        <div class="foot" style="margin-top:24px"><a href="/account/branding">← Back to branding</a></div>
      `));
    }

    // ─── POST /api/account/branding/upload-logo ────────────────────────
    if (p === '/api/account/branding/upload-logo' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const _clen = parseInt(request.headers.get('Content-Length')||'0',10);
      if (_clen > 600000) return Response.redirect(new URL('/account/branding/upload-logo?err=' + encodeURIComponent('File too large (max 500KB)'), url.origin).toString(), 302);
      try {
        const fd = await request.formData();
        const file = fd.get('logo');
        if (!file || typeof file === 'string') return Response.redirect(new URL('/account/branding/upload-logo?err=' + encodeURIComponent('No file uploaded'), url.origin).toString(), 302);
        const ct = file.type || '';
        const allowedTypes = ['image/png','image/jpeg','image/jpg','image/svg+xml'];
        if (!allowedTypes.includes(ct)) return Response.redirect(new URL('/account/branding/upload-logo?err=' + encodeURIComponent('Only PNG, JPG or SVG allowed'), url.origin).toString(), 302);
        const ext = ct === 'image/svg+xml' ? 'svg' : ct === 'image/png' ? 'png' : 'jpg';
        const bytes = await file.arrayBuffer();
        if (bytes.byteLength > 500000) return Response.redirect(new URL('/account/branding/upload-logo?err=' + encodeURIComponent('File >500KB'), url.origin).toString(), 302);
        // Push to GitHub via gh-write style POST to asgard-tools
        const b64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        const path = 'logos/' + session.sid + '.' + ext;
        if (!env.GITHUB_TOKEN) {
          // Fallback: store as data URL in D1 logo_url (size-limited)
          const dataUrl = 'data:' + ct + ';base64,' + b64;
          await env.SSP_DB.prepare('UPDATE schools SET logo_url=?, updated_at=datetime("now") WHERE id=?').bind(dataUrl, session.sid).run();
          return Response.redirect(new URL('/account/branding/upload-logo?ok=' + encodeURIComponent('Logo saved (stored inline)'), url.origin).toString(), 302);
        }
        // Push via GitHub API
        const ghCheck = await fetch('https://api.github.com/repos/LuckDragonAsgard/schoolsportportal/contents/' + path, { headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN, 'User-Agent': 'ssp-auth-worker' } });
        let sha = '';
        if (ghCheck.ok) { const e = await ghCheck.json(); sha = e.sha; }
        const ghResp = await fetch('https://api.github.com/repos/LuckDragonAsgard/schoolsportportal/contents/' + path, {
          method: 'PUT', headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'ssp-auth-worker' },
          body: JSON.stringify({ message: 'Upload logo for ' + session.sid, content: b64, sha: sha || undefined })
        });
        if (!ghResp.ok) {
          const txt = await ghResp.text();
          return Response.redirect(new URL('/account/branding/upload-logo?err=' + encodeURIComponent('GitHub push failed: ' + ghResp.status), url.origin).toString(), 302);
        }
        const logoUrl = 'https://schoolsportportal.com.au/' + path + '?v=' + Date.now();
        await env.SSP_DB.prepare('UPDATE schools SET logo_url=?, updated_at=datetime("now") WHERE id=?').bind(logoUrl, session.sid).run();
        return Response.redirect(new URL('/account/branding/upload-logo?ok=' + encodeURIComponent('Logo uploaded'), url.origin).toString(), 302);
      } catch (e) {
        return Response.redirect(new URL('/account/branding/upload-logo?err=' + encodeURIComponent('Upload failed: ' + e.message), url.origin).toString(), 302);
      }
    }

    // ─── GET /account/sports ───────────────────────────────────────────
    if (p === '/account/sports' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/sports', url.origin).toString(), 302);
      const sch = await env.SSP_DB.prepare('SELECT id, name FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const ok = url.searchParams.get('ok');
      const sports = await env.SSP_DB.prepare('SELECT id, sport_code, sport_label, active, coordinator_name, coordinator_email, display_order FROM school_sports WHERE school_id = ? ORDER BY display_order, sport_label').bind(session.sid).all();
      const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      return htmlResponse(pageShell('Sports & coordinators · ' + sch.name, `
        <h1>Sports & coordinators</h1>
        <p class="sub">Tick the sports your school competes in. Add the teacher coordinator for each (optional).</p>
        ${ok?`<div style="background:#dcfce7;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(ok)}</div>`:''}
        <form method="POST" action="/api/account/sports" style="margin-top:14px">
          <table style="width:100%;border-collapse:collapse;font-size:.9rem">
            <thead><tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0"><th style="padding:8px;text-align:left;width:60px">Active</th><th style="padding:8px;text-align:left">Sport</th><th style="padding:8px;text-align:left">Coordinator</th><th style="padding:8px;text-align:left">Email</th></tr></thead>
            <tbody>${(sports.results||[]).map(s => `
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:6px 8px;text-align:center"><input type="checkbox" name="active_${s.id}" ${s.active?'checked':''}></td>
                <td style="padding:6px 8px"><strong>${esc(s.sport_label)}</strong></td>
                <td style="padding:6px 8px"><input type="text" name="coord_name_${s.id}" value="${esc(s.coordinator_name)}" style="width:100%;padding:5px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:.85rem"></td>
                <td style="padding:6px 8px"><input type="email" name="coord_email_${s.id}" value="${esc(s.coordinator_email)}" style="width:100%;padding:5px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:.85rem"></td>
              </tr>`).join('')}</tbody>
          </table>
          <button type="submit" style="margin-top:18px;background:#1d4ed8;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;cursor:pointer">Save sports</button>
        </form>
        <div class="foot" style="margin-top:24px"><a href="/account">← Back to account</a></div>
      `));
    }
    if (p === '/api/account/sports' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const sports = await env.SSP_DB.prepare('SELECT id FROM school_sports WHERE school_id = ?').bind(session.sid).all();
      for (const s of (sports.results||[])) {
        const active = fd.get('active_' + s.id) ? 1 : 0;
        const name = String(fd.get('coord_name_' + s.id)||'').trim().slice(0, 200);
        const email = String(fd.get('coord_email_' + s.id)||'').trim().slice(0, 200);
        await env.SSP_DB.prepare('UPDATE school_sports SET active=?, coordinator_name=?, coordinator_email=?, updated_at=datetime("now") WHERE id=?').bind(active, name, email, s.id).run();
      }
      return Response.redirect(new URL('/account/sports?ok=Sports+saved', url.origin).toString(), 302);
    }

    // ─── GET /account/news ─────────────────────────────────────────────
    if (p === '/account/news' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/news', url.origin).toString(), 302);
      const sch = await env.SSP_DB.prepare('SELECT id, name, account_type FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const ok = url.searchParams.get('ok');
      const SCOPE_MAP = { 'williamstownprimary': ['school','williamstown-primary'], 'hobsonsbay': ['division','hobsonsbay-division'], 'wyndham': ['division','wyndham-division'], 'williamstown-district': ['district','williamstown-district'] };
      const [scopeType, scopeId] = SCOPE_MAP[sch.id] || [sch.account_type || 'school', sch.id];
      const news = await env.SSP_DB.prepare('SELECT id, title, body, category, pinned, publish_at, expires_at, active, created_at FROM announcements WHERE scope=? AND scope_id=? ORDER BY pinned DESC, created_at DESC LIMIT 20').bind(scopeType, scopeId).all();
      const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      return htmlResponse(pageShell('Announcements · ' + sch.name, `
        <h1>Announcements / news</h1>
        <p class="sub">Post notices that appear on your school / district / division portal page. Expires after the date you set.</p>
        ${ok?`<div style="background:#dcfce7;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(ok)}</div>`:''}
        <h2 style="font-size:1.1rem;font-weight:800;color:#0d1b3e;margin:18px 0 6px">Current announcements</h2>
        ${(news.results||[]).length === 0 ? '<p style="color:#94a3b8;font-style:italic">No announcements yet. Post one below.</p>' : (news.results||[]).map(n => `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;margin-bottom:10px;${n.pinned?'border-left:3px solid #f59e0b':''}">
            <div style="display:flex;justify-content:space-between;align-items:start">
              <strong style="font-size:.95rem">${esc(n.title)}</strong>
              <form method="POST" action="/api/account/news/delete" style="display:inline"><input type="hidden" name="id" value="${n.id}"><button type="submit" style="background:none;border:0;color:#dc2626;font-size:.78rem;cursor:pointer">Delete</button></form>
            </div>
            ${n.body?`<div style="margin-top:6px;font-size:.85rem;color:#475569">${esc(n.body).replace(/\n/g,'<br>')}</div>`:''}
            <div style="margin-top:6px;font-size:.72rem;color:#94a3b8">${esc(n.category)}${n.expires_at?` · expires ${esc(n.expires_at)}`:''}${n.pinned?' · PINNED':''}</div>
          </div>`).join('')}
        <h2 style="font-size:1.1rem;font-weight:800;color:#0d1b3e;margin:24px 0 6px">Post new announcement</h2>
        <form method="POST" action="/api/account/news" style="display:grid;gap:12px;margin-top:10px">
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Title</span>
            <input type="text" name="title" required maxlength="120" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Body (optional)</span>
            <textarea name="body" rows="3" maxlength="1000" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit"></textarea></label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Category</span>
              <select name="category" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px">
                <option value="general">General</option>
                <option value="carnival">Carnival</option>
                <option value="reschedule">Reschedule</option>
                <option value="results">Results</option>
                <option value="reminder">Reminder</option>
              </select></label>
            <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Expires (YYYY-MM-DD)</span>
              <input type="date" name="expires_at" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px"></label>
          </div>
          <label style="display:flex;gap:8px;align-items:center;font-size:.85rem">
            <input type="checkbox" name="pinned" value="1"> Pin to top
          </label>
          <button type="submit" style="background:#1d4ed8;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;cursor:pointer;width:fit-content">Post announcement</button>
        </form>
        <div class="foot" style="margin-top:24px"><a href="/account">← Back to account</a></div>
      `));
    }
    if (p === '/api/account/news' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const sch = await env.SSP_DB.prepare('SELECT id, account_type FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const SCOPE_MAP = { 'williamstownprimary': ['school','williamstown-primary'], 'hobsonsbay': ['division','hobsonsbay-division'], 'wyndham': ['division','wyndham-division'], 'williamstown-district': ['district','williamstown-district'] };
      const [scopeType, scopeId] = SCOPE_MAP[sch.id] || [sch.account_type || 'school', sch.id];
      const title = String(fd.get('title')||'').trim().slice(0, 200);
      const body = String(fd.get('body')||'').trim().slice(0, 2000);
      const category = String(fd.get('category')||'general').trim();
      const expires = String(fd.get('expires_at')||'').trim() || null;
      const pinned = fd.get('pinned') ? 1 : 0;
      if (!title) return Response.redirect(new URL('/account/news?ok=Missing+title', url.origin).toString(), 302);
      await env.SSP_DB.prepare('INSERT INTO announcements (scope, scope_id, title, body, category, pinned, expires_at, active, created_by) VALUES (?,?,?,?,?,?,?,1,?)').bind(scopeType, scopeId, title, body, category, pinned, expires, session.sid).run();
      return Response.redirect(new URL('/account/news?ok=Announcement+posted', url.origin).toString(), 302);
    }
    if (p === '/api/account/news/delete' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const id = parseInt(fd.get('id') || '0');
      if (id) {
        const sch = await env.SSP_DB.prepare('SELECT id, account_type FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
        if (sch) {
          const SCOPE_MAP = { 'williamstownprimary': ['school','williamstown-primary'], 'hobsonsbay': ['division','hobsonsbay-division'], 'wyndham': ['division','wyndham-division'], 'williamstown-district': ['district','williamstown-district'] };
          const [scopeType, scopeId] = SCOPE_MAP[sch.id] || [sch.account_type || 'school', sch.id];
          await env.SSP_DB.prepare('DELETE FROM announcements WHERE id=? AND scope=? AND scope_id=?').bind(id, scopeType, scopeId).run();
        }
      }
      return Response.redirect(new URL('/account/news?ok=Announcement+removed', url.origin).toString(), 302);
    }


    // ─── GET /account/records ──────────────────────────────────────────
    if (p === '/account/records' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/records', url.origin).toString(), 302);
      const sch = await env.SSP_DB.prepare('SELECT id, name, account_type, district_id FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const ok = url.searchParams.get('ok');
      const err = url.searchParams.get('err');
      const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      // Map account_type to (scope, scope_id) for the importer
      const scope = sch.account_type === 'school' ? 'school' : sch.account_type === 'district' ? 'district' : 'division';
      const SCOPE_ID_ALIASES = {
        'williamstownprimary': 'williamstown-primary',
        'hobsonsbay': 'hobsonsbay-division',
        'wyndham': 'wyndham-division',
      };
      const scope_id = SCOPE_ID_ALIASES[sch.id] || sch.id;
      return htmlResponse(pageShell('Records · ' + sch.name, `
        <h1>Historical records — bulk import</h1>
        <p class="sub">Upload a CSV of past event records (best times, distances, age champions). Each row replaces or beats the existing slot.</p>
        ${ok?`<div style="background:#dcfce7;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(ok)}</div>`:''}
        ${err?`<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(err)}</div>`:''}
        <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:14px 16px;margin:14px 0;font-size:.88rem;color:#334155">
          <strong>Target scope:</strong> ${scope} / ${scope_id}<br>
          <strong>CSV format required:</strong><br>
          <code style="font-size:.78rem">sport,event_name,age_group,gender,record_value,record_unit,athlete_name,athlete_school,year_set,source</code><br>
          <em>Example:</em> <code style="font-size:.78rem">Athletics,100m,11,Girls,13.82,seconds,Lani Platt,Williamstown Primary,2023,District Carnival 2023</code>
        </div>
        <form method="POST" action="/api/account/records/import" enctype="application/x-www-form-urlencoded" style="display:grid;gap:14px;margin-top:18px">
          <input type="hidden" name="scope" value="${scope}">
          <input type="hidden" name="scope_id" value="${esc(scope_id)}">
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Paste CSV (max 100KB)</span>
            <textarea name="csv" rows="12" required style="padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:.82rem;font-family:Consolas,Monaco,monospace" placeholder="sport,event_name,age_group,gender,record_value,record_unit,athlete_name,athlete_school,year_set,source\nAthletics,100m,11,Girls,13.82,seconds,Lani Platt,Williamstown Primary,2023,District Carnival 2023"></textarea></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Dry run? (preview only, no D1 changes)</span>
            <select name="dry_run" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:.95rem;width:200px">
              <option value="1">Yes — preview</option>
              <option value="0">No — write to D1</option>
            </select></label>
          <button type="submit" style="background:#1d4ed8;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer;width:fit-content">Import records</button>
        </form>
        <div class="foot" style="margin-top:24px"><a href="/account">← Back to account</a></div>
      `));
    }

    // ─── POST /api/account/records/import ──────────────────────────────
    if (p === '/api/account/records/import' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const _clen = parseInt(request.headers.get('Content-Length')||'0',10);
      if (_clen > 102400) return Response.redirect(new URL('/account/records?err=' + encodeURIComponent('Payload too large (>100KB)'), url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const scope = String(fd.get('scope')||'').trim();
      let scope_id = String(fd.get('scope_id')||'').trim();
      // Normalize school id → records scope_id (e.g. williamstownprimary → williamstown-primary)
      const SCOPE_ID_ALIASES = {
        'williamstownprimary': 'williamstown-primary',
        'hobsonsbay': 'hobsonsbay-division',
        'wyndham': 'wyndham-division',
      };
      scope_id = SCOPE_ID_ALIASES[scope_id] || scope_id;
      const csv = String(fd.get('csv')||'').trim();
      const dryRun = String(fd.get('dry_run')||'1') === '1';
      if (!scope || !scope_id) return Response.redirect(new URL('/account/records?err=' + encodeURIComponent('Missing scope'), url.origin).toString(), 302);
      // Verify the user owns this scope_id
      const sch = await env.SSP_DB.prepare('SELECT id, account_type FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      const SCOPE_ID_ALIASES_AUTH = {
        'williamstownprimary': 'williamstown-primary',
        'hobsonsbay': 'hobsonsbay-division',
        'wyndham': 'wyndham-division',
      };
      const expectedScopeId = SCOPE_ID_ALIASES_AUTH[sch.id] || sch.id;
      if (!sch || expectedScopeId !== scope_id) {
        return Response.redirect(new URL('/account/records?err=' + encodeURIComponent('Not authorised for this scope'), url.origin).toString(), 302);
      }
      // Parse CSV
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return Response.redirect(new URL('/account/records?err=' + encodeURIComponent('No data rows found'), url.origin).toString(), 302);
      const header = lines[0].toLowerCase().split(',').map(s => s.trim());
      const requiredCols = ['sport','event_name','age_group','gender','record_value','athlete_name'];
      for (const c of requiredCols) {
        if (header.indexOf(c) < 0) return Response.redirect(new URL('/account/records?err=' + encodeURIComponent('Missing column: ' + c), url.origin).toString(), 302);
      }
      const colIdx = (n) => header.indexOf(n);
      let inserts = 0; let updates = 0; let skipped = 0; const errors = [];
      const parsed = [];
      for (let i = 1; i < lines.length && i < 500; i++) {
        const cols = lines[i].split(',').map(s => s.trim());
        const r = {
          sport: cols[colIdx('sport')],
          event_name: cols[colIdx('event_name')],
          age_group: cols[colIdx('age_group')],
          gender: cols[colIdx('gender')],
          record_value: cols[colIdx('record_value')],
          record_unit: colIdx('record_unit') >= 0 ? (cols[colIdx('record_unit')] || 'seconds') : 'seconds',
          athlete_name: cols[colIdx('athlete_name')],
          athlete_school: colIdx('athlete_school') >= 0 ? cols[colIdx('athlete_school')] : '',
          year_set: colIdx('year_set') >= 0 ? parseInt(cols[colIdx('year_set')]) || null : null,
          source: colIdx('source') >= 0 ? cols[colIdx('source')] : 'CSV import',
        };
        // Parse numeric_value from record_value
        let nv = parseFloat(r.record_value);
        if (r.record_value && r.record_value.indexOf(':') >= 0) {
          const [m,s] = r.record_value.split(':');
          nv = parseFloat(m)*60 + parseFloat(s);
        }
        if (!isFinite(nv) || !r.athlete_name) { skipped++; continue; }
        r.numeric_value = nv;
        // Determine is_lower_better (field events = higher better, track = lower better)
        const fieldEvents = ['Long Jump','Triple Jump','High Jump','Shot Put','Discus','Javelin'];
        r.is_lower_better = fieldEvents.indexOf(r.event_name) >= 0 ? 0 : 1;
        parsed.push(r);
      }
      if (dryRun) {
        return htmlResponse(pageShell('CSV Preview', `
          <h1>Dry-run preview</h1>
          <p class="sub">${parsed.length} valid row(s), ${skipped} skipped. No changes written.</p>
          <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:14px">
            <thead><tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0">
              <th style="padding:8px;text-align:left">Event</th><th style="padding:8px;text-align:left">Age</th><th style="padding:8px;text-align:left">Gender</th><th style="padding:8px;text-align:right">Value</th><th style="padding:8px;text-align:left">Athlete</th><th style="padding:8px;text-align:right">Year</th>
            </tr></thead><tbody>
            ${parsed.slice(0,50).map(r=>`<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:6px 8px">${r.sport} ${r.event_name}</td><td style="padding:6px 8px">${r.age_group}</td><td style="padding:6px 8px">${r.gender}</td><td style="padding:6px 8px;text-align:right;font-family:monospace">${r.record_value}</td><td style="padding:6px 8px">${r.athlete_name||''} (${r.athlete_school||''})</td><td style="padding:6px 8px;text-align:right">${r.year_set||''}</td></tr>`).join('')}
            </tbody></table>
          ${parsed.length > 50 ? `<p style="margin-top:14px;color:#64748b;font-size:.85rem">+ ${parsed.length-50} more rows...</p>`:''}
          <form method="POST" action="/api/account/records/import" style="margin-top:24px">
            <input type="hidden" name="scope" value="${scope}">
            <input type="hidden" name="scope_id" value="${scope_id}">
            <input type="hidden" name="csv" value="${csv.replace(/"/g,'&quot;')}">
            <input type="hidden" name="dry_run" value="0">
            <button type="submit" style="background:#16a34a;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;font-size:1rem;cursor:pointer">Confirm and import to D1</button>
            <a href="/account/records" style="margin-left:14px;color:#64748b">Cancel</a>
          </form>
        `));
      }
      // Real import — bulk INSERT ... ON CONFLICT DO UPDATE only if beats
      for (const r of parsed) {
        try {
          const existing = await env.SSP_DB.prepare(
            'SELECT numeric_value, is_lower_better, record_value FROM event_records WHERE scope=? AND scope_id=? AND sport=? AND event_name=? AND age_group=? AND gender=?'
          ).bind(scope, scope_id, r.sport, r.event_name, r.age_group, r.gender).first();
          let beats = true;
          if (existing && existing.numeric_value != null) {
            const lower = existing.is_lower_better !== 0;
            beats = lower ? (r.numeric_value < existing.numeric_value) : (r.numeric_value > existing.numeric_value);
          }
          if (beats) {
            await env.SSP_DB.prepare(
              'INSERT INTO event_records (scope, scope_id, sport, event_name, age_group, gender, record_value, record_unit, numeric_value, is_lower_better, athlete_name, athlete_school, year_set, source, verified, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(scope, scope_id, sport, event_name, age_group, gender) DO UPDATE SET record_value=excluded.record_value, numeric_value=excluded.numeric_value, athlete_name=excluded.athlete_name, athlete_school=excluded.athlete_school, year_set=excluded.year_set, source=excluded.source, verified=excluded.verified, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP'
            ).bind(scope, scope_id, r.sport, r.event_name, r.age_group, r.gender, r.record_value, r.record_unit, r.numeric_value, r.is_lower_better, r.athlete_name, r.athlete_school, r.year_set, r.source, 1, 'Imported via CSV ' + new Date().toISOString().slice(0,10)).run();
            if (existing && existing.numeric_value != null) updates++; else inserts++;
          } else {
            skipped++;
          }
        } catch (e) {
          errors.push(r.sport + ' ' + r.event_name + ' ' + r.age_group + ' ' + r.gender + ': ' + e.message);
        }
      }
      const msg = inserts + ' inserted, ' + updates + ' updated, ' + skipped + ' skipped' + (errors.length ? '. Errors: ' + errors.length : '');
      return Response.redirect(new URL('/account/records?ok=' + encodeURIComponent(msg), url.origin).toString(), 302);
    }

    // ─── GET /account/calendar ──────────────────────────────────────────
    if (p === '/account/calendar' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin?next=/account/calendar', url.origin).toString(), 302);
      const sch = await env.SSP_DB.prepare('SELECT id, name, account_type FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const ok = url.searchParams.get('ok');
      const err = url.searchParams.get('err');
      const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
      // Fetch all vendors grouped by resource_type
      const vendors = await env.SSP_DB.prepare('SELECT resource_type, vendor_name, vendor_phone, vendor_email, website_url, service_area, notes FROM vendor_directory WHERE active = 1 ORDER BY resource_type, vendor_name').all();
      // Fetch all bookings for this scope
      const SCOPE_MAP = { 'williamstownprimary': ['school','williamstown-primary'], 'hobsonsbay': ['division','hobsonsbay-division'], 'wyndham': ['division','wyndham-division'], 'williamstown-district': ['district','williamstown-district'] };
      const [scopeType, scopeId] = SCOPE_MAP[sch.id] || [sch.account_type || 'school', sch.id];
      const bookings = await env.SSP_DB.prepare('SELECT id, event_slug, event_date, resource_type, vendor_name, vendor_phone, status, notes, cost_estimate FROM event_bookings WHERE scope=? AND scope_id=? ORDER BY event_date, resource_type').bind(scopeType, scopeId).all();
      // Group vendors by resource_type
      const vByType = {};
      for (const v of (vendors.results||[])) { (vByType[v.resource_type] = vByType[v.resource_type]||[]).push(v); }
      const resourceLabels = { 'first_aid': 'First Aid', 'ground_hire': 'Ground / Venue', 'umpires': 'Umpires / Referees', 'equipment': 'Equipment Hire', 'catering': 'Catering / Canteen' };
      const vendorRowsHTML = Object.entries(vByType).map(([type, vs]) => `
        <h3 style="font-size:1rem;font-weight:800;color:#0d1b3e;margin:24px 0 10px">${esc(resourceLabels[type]||type)}</h3>
        <div style="display:grid;gap:8px">
          ${vs.map(v => `
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px">
              <div style="font-weight:700;font-size:.92rem">${esc(v.vendor_name)}</div>
              ${v.service_area?`<div style="font-size:.75rem;color:#64748b;margin-top:2px">${esc(v.service_area)}</div>`:''}
              <div style="margin-top:6px;font-size:.82rem;color:#475569">
                ${v.vendor_phone?`<a href="tel:${esc(v.vendor_phone)}" style="color:#1d4ed8;text-decoration:none;margin-right:14px">${esc(v.vendor_phone)}</a>`:''}
                ${v.vendor_email?`<a href="mailto:${esc(v.vendor_email)}" style="color:#1d4ed8;text-decoration:none;margin-right:14px">${esc(v.vendor_email)}</a>`:''}
                ${v.website_url?`<a href="${esc(v.website_url)}" target="_blank" rel="noopener" style="color:#1d4ed8;text-decoration:none">Website</a>`:''}
              </div>
              ${v.notes?`<div style="font-size:.78rem;color:#64748b;margin-top:6px;font-style:italic">${esc(v.notes)}</div>`:''}
            </div>
          `).join('')}
        </div>
      `).join('');
      const bookingsHTML = (bookings.results||[]).length === 0
        ? `<p style="color:#94a3b8;font-style:italic">No bookings logged yet. Use the form below to record what you've booked.</p>`
        : `<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:.88rem">
            <thead><tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0"><th style="padding:8px;text-align:left">Event</th><th style="padding:8px;text-align:left">Resource</th><th style="padding:8px;text-align:left">Vendor</th><th style="padding:8px;text-align:center">Status</th></tr></thead>
            <tbody>${(bookings.results||[]).map(b => `
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:8px"><strong>${esc(b.event_slug)}</strong>${b.event_date?`<br><span style="font-size:.75rem;color:#64748b">${esc(b.event_date)}</span>`:''}</td>
                <td style="padding:8px">${esc(resourceLabels[b.resource_type]||b.resource_type)}</td>
                <td style="padding:8px">${esc(b.vendor_name||'\u2014')}${b.vendor_phone?`<br><span style="font-size:.75rem;color:#64748b">${esc(b.vendor_phone)}</span>`:''}</td>
                <td style="padding:8px;text-align:center"><span style="background:${b.status==='confirmed'?'#dcfce7':b.status==='pending'?'#fef3c7':'#fee2e2'};color:${b.status==='confirmed'?'#15803d':b.status==='pending'?'#a16207':'#991b1b'};font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:20px;text-transform:uppercase">${esc(b.status)}</span></td>
              </tr>`).join('')}</tbody></table>`;
      return htmlResponse(pageShell('Calendar · ' + sch.name, `
        <h1>Carnival booking calendar</h1>
        <p class="sub">Vendor directory + booking checklist for your carnivals. Track first aid, ground hire, umpires, equipment.</p>
        ${ok?`<div style="background:#dcfce7;border:1px solid #86efac;color:#166534;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(ok)}</div>`:''}
        ${err?`<div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:10px 14px;border-radius:8px;margin:12px 0">${esc(err)}</div>`:''}
        <h2 style="font-size:1.15rem;font-weight:800;color:#0d1b3e;margin:18px 0 6px;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Your bookings</h2>
        ${bookingsHTML}
        <h2 style="font-size:1.15rem;font-weight:800;color:#0d1b3e;margin:28px 0 6px;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Log a booking</h2>
        <form method="POST" action="/api/account/calendar/booking" style="display:grid;gap:14px;margin-top:14px">
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Event (e.g. wd-crosscountry-2026)</span>
            <input type="text" name="event_slug" required style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Event date (YYYY-MM-DD)</span>
            <input type="date" name="event_date" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Resource type</span>
            <select name="resource_type" required style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px">
              <option value="first_aid">First aid</option>
              <option value="ground_hire">Ground / venue hire</option>
              <option value="umpires">Umpires / referees</option>
              <option value="equipment">Equipment hire</option>
              <option value="catering">Catering / canteen</option>
            </select></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Vendor (from directory)</span>
            <input type="text" name="vendor_name" placeholder="Copy from list below" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Vendor phone (optional)</span>
            <input type="tel" name="vendor_phone" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Status</span>
            <select name="status" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px">
              <option value="pending">Pending (enquiry sent)</option>
              <option value="confirmed">Confirmed (booked + paid)</option>
              <option value="cancelled">Cancelled</option>
            </select></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Cost estimate (AUD, optional)</span>
            <input type="number" name="cost_estimate" min="0" step="0.01" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;width:200px"></label>
          <label style="display:grid;gap:4px"><span style="font-size:.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Notes</span>
            <textarea name="notes" rows="2" style="padding:9px 11px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit"></textarea></label>
          <button type="submit" style="background:#1d4ed8;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-weight:600;cursor:pointer;width:fit-content">Save booking</button>
        </form>
        <h2 style="font-size:1.15rem;font-weight:800;color:#0d1b3e;margin:28px 0 6px;border-bottom:2px solid #e2e8f0;padding-bottom:6px">Vendor directory</h2>
        ${vendorRowsHTML}
        <div class="foot" style="margin-top:24px"><a href="/account">← Back to account</a></div>
      `));
    }

    // ─── POST /api/account/calendar/booking ─────────────────────────────
    if (p === '/api/account/calendar/booking' && request.method === 'POST') {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const fd = await _safeFormData(request);
      const get = (k) => String(fd.get(k)||'').trim().slice(0, 500);
      const sch = await env.SSP_DB.prepare('SELECT id, account_type FROM schools WHERE id = ? AND active = 1').bind(session.sid).first();
      if (!sch) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      const SCOPE_MAP = { 'williamstownprimary': ['school','williamstown-primary'], 'hobsonsbay': ['division','hobsonsbay-division'], 'wyndham': ['division','wyndham-division'], 'williamstown-district': ['district','williamstown-district'] };
      const [scopeType, scopeId] = SCOPE_MAP[sch.id] || [sch.account_type || 'school', sch.id];
      try {
        await env.SSP_DB.prepare(
          'INSERT INTO event_bookings (scope, scope_id, event_slug, event_date, resource_type, vendor_name, vendor_phone, status, notes, cost_estimate) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(scope, scope_id, event_slug, resource_type) DO UPDATE SET event_date=excluded.event_date, vendor_name=excluded.vendor_name, vendor_phone=excluded.vendor_phone, status=excluded.status, notes=excluded.notes, cost_estimate=excluded.cost_estimate, updated_at=datetime("now")'
        ).bind(scopeType, scopeId, get('event_slug'), get('event_date'), get('resource_type'), get('vendor_name'), get('vendor_phone'), get('status') || 'pending', get('notes'), parseFloat(get('cost_estimate'))||null).run();
        return Response.redirect(new URL('/account/calendar?ok=Booking+saved', url.origin).toString(), 302);
      } catch (e) {
        return Response.redirect(new URL('/account/calendar?err=' + encodeURIComponent('Save failed: ' + e.message), url.origin).toString(), 302);
      }
    }

    // ─── GET /forgot-password ───────────────────────────────────────────
    if (p === '/forgot-password' && (request.method === 'GET' || request.method === 'HEAD')) {
      return htmlResponse(forgotPage(url.searchParams.get('msg')));
    }

    // ─── POST /api/auth/forgot ──────────────────────────────────────────
    if (p === '/api/auth/forgot' && request.method === 'POST') {
      const fd = await _safeFormData(request);
      const email = String(fd.get('email') || '').trim().toLowerCase();
      // Don't reveal whether the email exists — same response either way
      if (email && env.RESEND_API_KEY) {
        const school = await lookupSchoolByEmail(env, email);
        if (school) {
          // Generate setup_token and email it
          const token = crypto.randomUUID();
          const expires = new Date(Date.now() + 3600000).toISOString();
          await env.SSP_DB.prepare('UPDATE schools SET setup_token = ?, setup_token_expires = ? WHERE id = ?').bind(token, expires, school.id).run();
          // Send email (await via ctx.waitUntil so worker doesn't terminate first)
          ctx.waitUntil(fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'School Sport Portal <paddy@schoolsportportal.com.au>',
              to: [school.email],
              reply_to: 'paddy@schoolsportportal.com.au',
              subject: 'Reset your School Sport Portal password',
              html: buildResetEmailHtml(school, token),
              text: `Hi,\n\nReset your School Sport Portal password — link valid for 1 hour:\n\nhttps://schoolsportportal.com.au/reset-password?token=${token}\n\nIf you didn't request this, ignore this email.\n\nQuestions? Reply to this email.\n\n— Paddy at School Sport Portal\n  schoolsportportal.com.au`,
              headers: { 'List-Unsubscribe': '<mailto:paddy@schoolsportportal.com.au?subject=unsubscribe>' }
            })
          }).catch(() => {}));
        }
      }
      return Response.redirect(new URL('/forgot-password?msg=' + encodeURIComponent("If that email is on our system, we've sent a reset link. Check your inbox."), url.origin).toString(), 302);
    }

    // ─── GET /reset-password ───────────────────────────────────────────
    if (p === '/reset-password' && (request.method === 'GET' || request.method === 'HEAD')) {
      const token = url.searchParams.get('token');
      if (!token) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      // Lookup token
      const school = await env.SSP_DB.prepare(
        'SELECT id, email FROM schools WHERE setup_token = ? AND active = 1'
      ).bind(token).first();
      if (!school) {
        return htmlResponse(pageShell('Reset link expired', `
          <h1>Link expired or invalid</h1>
          <p class="sub">This reset link is no longer valid. Reset links expire after 1 hour or once used.</p>
          <div class="foot"><a href="/forgot-password">Request a new link</a> &middot; <a href="/signin">Sign in</a></div>
        `));
      }
      // Check expiry
      const exp = await env.SSP_DB.prepare('SELECT setup_token_expires FROM schools WHERE id = ?').bind(school.id).first();
      if (exp && exp.setup_token_expires) {
        const expDate = new Date(exp.setup_token_expires);
        if (expDate < new Date()) {
          return htmlResponse(pageShell('Reset link expired', `
            <h1>Link expired</h1>
            <p class="sub">Reset links expire after 1 hour.</p>
            <div class="foot"><a href="/forgot-password">Request a new link</a></div>
          `));
        }
      }
      const errBlock = url.searchParams.get('err') ? `<div class="err">${escapeHtml(url.searchParams.get('err'))}</div>` : '';
      return htmlResponse(pageShell('Set new password', `
        <h1>Set new password</h1>
        <p class="sub">Hi ${escapeHtml(school.email)} — enter a new password below.</p>
        ${errBlock}
        <form method="POST" action="/api/auth/reset" autocomplete="on">
          <input type="hidden" name="token" value="${escapeHtml(token)}">
          <div class="field"><label>New password</label><input type="password" name="new" required minlength="10" autocomplete="new-password" autofocus></div>
          <div class="field"><label>Confirm new password</label><input type="password" name="confirm" required minlength="10" autocomplete="new-password"></div>
          <button class="primary" type="submit">Set password &rarr;</button>
        </form>
        <div class="foot">Password must be at least 10 characters.</div>
      `));
    }

    // ─── POST /api/auth/reset ──────────────────────────────────────────
    if (p === '/api/auth/reset' && request.method === 'POST') {
      const fd = await _safeFormData(request);
      const token = String(fd.get('token') || '');
      const newP = String(fd.get('new') || '');
      const confirm = String(fd.get('confirm') || '');
      if (!token) return Response.redirect(new URL('/signin', url.origin).toString(), 302);
      if (newP.length < 10) return Response.redirect(new URL('/reset-password?token=' + encodeURIComponent(token) + '&err=' + encodeURIComponent('Password must be at least 10 characters'), url.origin).toString(), 302);
      if (newP !== confirm) return Response.redirect(new URL('/reset-password?token=' + encodeURIComponent(token) + '&err=' + encodeURIComponent('Passwords do not match'), url.origin).toString(), 302);
      const school = await env.SSP_DB.prepare(
        'SELECT id, email, setup_token_expires FROM schools WHERE setup_token = ? AND active = 1'
      ).bind(token).first();
      if (!school) return Response.redirect(new URL('/forgot-password?msg=' + encodeURIComponent('Reset link expired or invalid. Request a new one.'), url.origin).toString(), 302);
      if (school.setup_token_expires) {
        const expDate = new Date(school.setup_token_expires);
        if (expDate < new Date()) return Response.redirect(new URL('/forgot-password?msg=' + encodeURIComponent('Reset link expired. Request a new one.'), url.origin).toString(), 302);
      }
      // Hash + save, clear token
      const newHash = await pbkdf2Hash(newP);
      await env.SSP_DB.prepare(
        'UPDATE schools SET password_hash = ?, setup_token = NULL, setup_token_expires = NULL, updated_at = datetime("now") WHERE id = ?'
      ).bind(newHash, school.id).run();
      // Auto-sign-in
      const sessionToken = await makeSessionToken(school.id, sessionSecret);
      return new Response(null, {
        status: 302,
        headers: { 'Location': new URL('/account', url.origin).toString(), 'Set-Cookie': setSessionCookie(sessionToken) }
      });
    }

    // ─── GET /logout (and /signout) — clear cookie + redirect ─────────
    if ((p === '/logout' || p === '/signout') && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': new URL('/', url.origin).toString(), 'Set-Cookie': clearSessionCookie() }
      });
    }

    // ─── POST /api/auth/logout ──────────────────────────────────────────
    if ((p === '/api/auth/logout' || p === '/api/auth/signout') && (request.method === 'POST' || request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(null, { status: 302, headers: { 'Location': '/', 'Set-Cookie': clearSessionCookie() } });
    }

    // ─── GET /api/auth/me — JSON session check (for client JS) ──────────
    if (p === '/api/auth/me' && (request.method === 'GET' || request.method === 'HEAD')) {
      const session = await verifySessionToken(getCookie(request, COOKIE_NAME), sessionSecret);
      if (!session) return jsonResponse({ ok: false, signed_in: false });
      const school = await lookupSchoolById(env, session.sid);
      if (!school) return jsonResponse({ ok: false, signed_in: false });
      return jsonResponse({ ok: true, signed_in: true, school: { id: school.id, name: school.name, email: school.email, account_type: school.account_type } });
    }

    if (p === '/health') return jsonResponse({ ok: true, worker: 'ssp-auth', version: '1.0.0' });

    return new Response('Not found', { status: 404 });
    } catch (err) {
      // Defensive: any uncaught exception in handler — return JSON 500, never CF 1101
      return _safeJson({ ok: false, error: 'internal_error', detail: String(err && err.message || err).slice(0, 200) }, 500);
    }
  }
};