// ssp-data — public read-only API surface for SSP pages
// Routes (bound on schoolsportportal.com.au/api/data/*):
//   GET /api/data/school/:slug/summary  → carnivals + counts
//   GET /api/data/carnival/:code/results → live results for a carnival
//   GET /api/data/health

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      'Vary': 'Origin, Cookie',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extraHeaders,
    }
  });
}

function nameToSchoolMatch(slug) {
  // Map slug → school name patterns to search carnival-results-db.carnivals.school
  const map = {
    'williamstownprimary': ['Williamstown Primary'],
    'williamstown-primary': ['Williamstown Primary'],
    'williamstown-district': ['Williamstown District'],
    'williamstowndistrict': ['Williamstown District'],
    'hobsonsbay': ['Hobsons Bay'],
    'hobsons-bay': ['Hobsons Bay']
  };
  return map[slug] || [];
}

async function getSchoolSummary(env, schoolSlug) {
  // 1. Get carnivals planned in ssp-db
  const planned = await env.SSP_DB.prepare(
    'SELECT id, name, type, date, status FROM carnivals WHERE school_id = ? ORDER BY date'
  ).bind(schoolSlug).all();

  // 2. Get published carnivals from carnival-results-db (matching by school name)
  const namePatterns = nameToSchoolMatch(schoolSlug);
  let published = { results: [] };
  if (namePatterns.length) {
    const likes = namePatterns.map(() => 'school LIKE ?').join(' OR ');
    const params = namePatterns.map(n => `%${n}%`);
    published = await env.CARNIVAL_DB.prepare(
      `SELECT code, school, sport, name, published_at FROM carnivals WHERE (${likes}) ORDER BY published_at DESC LIMIT 20`
    ).bind(...params).all();
  }

  // 3. School info
  const school = await env.SSP_DB.prepare(
    'SELECT id, name, suburb, state, student_count, district_id, account_type FROM schools WHERE id = ? AND active = 1'
  ).bind(schoolSlug).first();

  return {
    ok: true,
    school,
    planned_carnivals: planned.results || [],
    published_carnivals: published.results || [],
    counts: {
      planned: (planned.results || []).length,
      published: (published.results || []).length,
      completed: (planned.results || []).filter(c => c.status === 'done').length,
      upcoming: (planned.results || []).filter(c => c.status === 'upcoming' || c.status === 'live').length
    }
  };
}

async function getCarnivalResults(env, code) {
  // Try carnival-results worker for live results
  try {
    const r = await fetch(`https://carnival-results.pgallivan.workers.dev/api/results/${encodeURIComponent(code)}`, { cf: { cacheTtl: 30 } });
    if (r.ok) {
      const data = await r.json();
      return { ok: true, code, source: 'carnival-results', ...data };
    }
    if (r.status === 404) {
      return { ok: true, code, status: 'pending', message: 'No results published yet', results: [] };
    }
  } catch (e) {
    /* fall through to local DB */
  }

  // Fallback: query carnival_results table directly
  const meta = await env.CARNIVAL_DB.prepare('SELECT * FROM carnivals WHERE code = ?').bind(code.toUpperCase()).first();
  if (!meta) return json({ ok: false, error: 'Carnival not found' }, 404);

  // Try to derive carnival_id slug from code (lookups not 1:1; fallback to direct table search)
  const results = await env.CARNIVAL_DB.prepare(
    'SELECT id, event, age_group, gender, results, published_at FROM carnival_results WHERE carnival_id LIKE ? ORDER BY published_at'
  ).bind(`%${code.toLowerCase()}%`).all();

  return { ok: true, code, source: 'd1-fallback', meta, results: results.results || [] };
}


// Module-scope cache (in-memory, per-isolate) + Cloudflare Cache API (cross-isolate)
let _calendarCache = { data: null, expires: 0 };
const CACHE_KEY = 'https://cache.internal/ssp/division-calendar/v2';

async function getDivisionCalendar(env) {
  const _cacheNow = Date.now();
  if (_calendarCache.data && _calendarCache.expires > _cacheNow) {
    return _calendarCache.data;
  }
  // Check CF edge cache (shared across isolates in the same colo)
  try {
    const cache = caches.default;
    const cached = await cache.match(CACHE_KEY);
    if (cached) {
      const data = await cached.json();
      _calendarCache = { data, expires: _cacheNow + 60000 };
      return data;
    }
  } catch (_) {}
  const SHEET_ID = '1uJBqK3BBd3Ig_qfJcqUEvNImIBBl5CNzlRKqJGMK3XI';
  const GID = '796500538';
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  const r = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) {
    if (_calendarCache.data) return _calendarCache.data;
    return { ok: false, error: 'sheet fetch ' + r.status };
  }
  const csv = await r.text();
  // Parse CSV (basic; handles quoted fields with commas)
  function parseCsv(text) {
    const out = [];
    let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
        else if (c === '"') { q = false; }
        else { field += c; }
      } else {
        if (c === '"') q = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); out.push(row); row = []; field = ''; }
        else if (c === '\r') { /* skip */ }
        else field += c;
      }
    }
    if (field || row.length) { row.push(field); out.push(row); }
    return out;
  }
  const rows = parseCsv(csv);
  // Find header
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === 'Term' && rows[i].includes('Event')) { headerIdx = i; break; }
  }
  if (headerIdx < 0) return { ok: false, error: 'header not found' };
  const events = [];
  let curTerm = '';
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r.some(x => x && x.trim())) continue;
    if (r[0] && r[0].trim()) curTerm = r[0].trim();
    const date = (r[2] || '').trim();
    const event = (r[3] || '').trim();
    if (!date || !event) continue;
    if (['WINTER SPORT', 'SUMMER SPORT'].includes(event.toUpperCase())) continue;
    events.push({
      term: curTerm,
      week: (r[1] || '').trim(),
      date,
      event,
      venue: (r[4] || '').trim(),
      convenor: (r[5] || '').trim(),
      confirmed: ['YES', 'CONFIRMED'].includes((r[6] || '').trim().toUpperCase()),
      district: (r[7] || '').trim()
    });
  }
  // Tag past/upcoming by parsing the date
  const now = new Date();
  for (const e of events) {
    const d = new Date(e.date);
    e.past = !isNaN(d.getTime()) && d < now;
  }
  const _calRes = { ok: true, source: 'Division Working Calendar 2026', total: events.length, events };
  _calendarCache = { data: _calRes, expires: _cacheNow + 60000 };
  // Write to CF edge cache so other isolates skip the Sheets fetch
  try {
    const cache = caches.default;
    await cache.put(CACHE_KEY, new Response(JSON.stringify(_calRes), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=300' }
    }));
  } catch (_) {}
  return _calRes;
}


function eventSlug(e) {
  // Deterministic slug — INCLUDE parenthetical to avoid collisions (Hockey 7's (Hobsons Bay) vs (Wyndham))
  const paren = (e.event.match(/\(([^)]+)\)/) || [,''])[1].toLowerCase();
  const baseName = e.event.replace(/\([^)]*\)/g, '').trim();
  const slug = (baseName + (paren ? '-' + paren : '') + '-' + e.date).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug;
}

async function getEventBySlug(env, slug) {
  const cal = await getDivisionCalendar(env);
  if (!cal.ok) return null;
  return cal.events.find(e => eventSlug(e) === slug) || null;
}

async function getEntries(env, eventId) {
  const rows = await env.SSP_DB.prepare(
    'SELECT id, school_id, school_name, contact_name, contact_email, contact_phone, team_count, students_count, status, notes, created_at, updated_at FROM event_entries WHERE event_id = ? ORDER BY created_at'
  ).bind(eventId).all();
  return rows.results || [];
}

async function addEntry(env, body) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const teamCount = parseInt(body.team_count) || 1;
  const studentsCount = parseInt(body.students_count) || 0;
  await env.SSP_DB.prepare(
    'INSERT INTO event_entries (id, event_id, school_id, school_name, contact_name, contact_email, contact_phone, team_count, students_count, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.event_id, body.school_id || '', body.school_name || '', body.contact_name || '', body.contact_email || '', body.contact_phone || '', teamCount, studentsCount, 'entered', body.notes || '', now, now).run();
  return { id, event_id: body.event_id };
}


// Map event name → canonical sport key for district_teams lookup
function eventToSport(eventName) {
  const n = eventName.toLowerCase();
  if (n.includes('afl')) return 'AFL';
  if (n.includes('soccer')) return 'Soccer';
  if (n.includes('netball')) return 'Netball';
  if (n.includes('hockey')) return 'Hockey';
  if (n.includes('softball')) return 'Softball';
  if (n.includes('basketball')) return 'Basketball';
  if (n.includes('cricket')) return 'Cricket';
  if (n.includes('hot shots') || n.includes('tennis')) return 'Hot Shots';
  if (n.includes('tee') || n.includes('teeball')) return 'Tee Ball';
  if (n.includes('volleyball')) return 'Volleyball';
  if (n.includes('cross country')) return 'Cross Country';
  if (n.includes('athletics')) return 'Athletics';
  if (n.includes('swim')) return 'Swimming';
  return null;
}

// Map host district name from sheet → ssp-db.schools.id
function districtNameToId(name) {
  const map = {
    'williamstown': 'williamstown-district',
    'altona': 'altona-district',
    'laverton': 'laverton-district',
    'hoppers crossing': 'hopperscrossing-district',
    'werribee': 'werribee-district',
    'point cook': 'pointcook-district',
    'tarneit': 'tarneit-district',
    'truganina': 'truganina-district',
    'derrimut': 'derrimut-district',
    'newport': 'newport-district'
  };
  return map[(name || '').toLowerCase().trim()] || null;
}

async function getAutoTeams(env, hostDistrict, sport, year) {
  if (!hostDistrict || !sport) return [];
  const r = await env.SSP_DB.prepare(
    'SELECT id, school_id, school_name, team_count, students_count, contact_name, contact_email FROM district_teams WHERE district_id = ? AND sport = ? AND year = ? ORDER BY school_name'
  ).bind(hostDistrict, sport, year).all();
  return r.results || [];
}

async function getEventStatus(env, slug) {
  const r = await env.SSP_DB.prepare('SELECT * FROM event_status WHERE event_id = ?').bind(slug).first();
  return r || null;
}

async function setEventStatus(env, slug, fields, updatedBy) {
  const now = Date.now();
  const existing = await getEventStatus(env, slug);
  if (existing) {
    const keys = Object.keys(fields);
    if (!keys.length) return existing;
    const sets = keys.map(k => k + ' = ?').join(', ') + ', updated_by = ?, updated_at = ?';
    const vals = keys.map(k => fields[k]);
    vals.push(updatedBy || '');
    vals.push(now);
    vals.push(slug);
    await env.SSP_DB.prepare('UPDATE event_status SET ' + sets + ' WHERE event_id = ?').bind(...vals).run();
  } else {
    const cols = ['event_id', ...Object.keys(fields), 'updated_by', 'updated_at'];
    const placeholders = cols.map(() => '?').join(', ');
    const vals = [slug, ...Object.values(fields), updatedBy || '', now];
    await env.SSP_DB.prepare('INSERT INTO event_status (' + cols.join(', ') + ') VALUES (' + placeholders + ')').bind(...vals).run();
  }
  return await getEventStatus(env, slug);
}


async function _verifySession(request, env) {
  try {
    const cookie = request.headers.get('Cookie') || '';
    const m = cookie.match(/(?:^|;\s*)ssp_session=([^;]+)/);
    if (!m) return null;
    const token = decodeURIComponent(m[1]);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [payloadB64, sig] = [parts[0] + '.' + parts[1], parts[2]];
    const secret = env.SESSION_SECRET || env.AUTH_SECRET || '';
    if (!secret) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const expectedBytes = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, expectedBytes, enc.encode(payloadB64));
    if (!ok) return null;
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    const ALLOWED_ORIGINS = [
      'https://schoolsportportal.com.au',
      'https://www.schoolsportportal.com.au',
      'https://sportcarnival.com.au',
      'https://carnivaltiming.com',
    ];
    const reqOrigin = request.headers.get('Origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : '';
    const corsHeaders = allowedOrigin ? {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    } : {};
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    if (p === '/api/data/health') return json({ ok: true, worker: 'ssp-data', version: '1.0.0' });

    // /api/data/school/{slug}/summary
    let m = p.match(/^\/api\/data\/school\/([a-z0-9-]+)\/summary$/);
    if (m) {
      try {
        const data = await getSchoolSummary(env, m[1]);
        return json(data);
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // /api/data/carnival/{code}/results
    m = p.match(/^\/api\/data\/carnival\/([A-Za-z0-9]+)\/results$/);
    if (m) {
      try {
        const data = await getCarnivalResults(env, m[1].toUpperCase());
        return json(data);
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // /api/data/division/calendar — Google Sheets-backed division calendar
    if (p === '/api/data/division/calendar' && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const data = await getDivisionCalendar(env);
        return json(data);
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // /api/data/event/{slug} — single event detail + entries
    let mEv = p.match(/^\/api\/data\/event\/([a-z0-9-]+)$/);
    if (mEv && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const ev = await getEventBySlug(env, mEv[1]);
        if (!ev) return json({ ok: false, error: 'event not found' }, 404);
        ev.slug = mEv[1];
        ev.entries = await getEntries(env, mEv[1]);
        // Auto-populate expected teams from district roster
        const sport = eventToSport(ev.event);
        const hostDistrictId = districtNameToId(ev.district);
        ev.sport_key = sport;
        ev.host_district_id = hostDistrictId;
        ev.auto_teams = (sport && hostDistrictId)
          ? await getAutoTeams(env, hostDistrictId, sport, 2026)
          : [];
        ev.status = await getEventStatus(env, mEv[1]);
        return json({ ok: true, event: ev });
      } catch (e) { return json({ ok: false, error: e.message }, 500); }
    }

    // /api/data/event/{slug}/status — PUT updates status fields (convenor controls)
    let mStat = p.match(/^\/api\/data\/event\/([a-z0-9-]+)\/status$/);
    if (mStat && request.method === 'PUT') {
      try {
        // SECURITY: require valid signed session cookie + reject unknown slugs (no upsert)
        const _sessUser = await _verifySession(request, env);
        if (!_sessUser) return json({ ok: false, error: 'unauthorized' }, 401, corsHeaders);
        // Confirm slug exists in calendar before allowing writes
        const _evt = await getEventBySlug(env, mStat[1]);
        if (!_evt) return json({ ok: false, error: 'event not found' }, 404, corsHeaders);
        const body = await request.json();
        const allowed = ['venue_confirmed','refs_booked','helpers_booked','first_aid_booked','club_contacted'];
        const fields = {};
        for (const k of allowed) if (k in body) fields[k] = body[k] ? 1 : 0;
        if ('notes' in body) {
          // Strip all HTML tags + decode entities — XSS hardening
          fields.notes = String(body.notes).replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c])).slice(0, 1000);
        }
        const result = await setEventStatus(env, mStat[1], fields, _sessUser.school || body.updated_by || '');
        return json({ ok: true, status: result }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500); }
    }

    // /api/data/district/{id}/history — past winners per sport per year
    let mHist = p.match(/^\/api\/data\/district\/([a-z0-9-]+)\/history$/);
    if (mHist && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const SLUG_ALIASES = {'wd':'williamstown-district','williamstown':'williamstown-district','hb':'hobsonsbay-district','hobsonsbay':'hobsonsbay-district','hobsons-bay':'hobsonsbay-district'};
        const districtId = SLUG_ALIASES[mHist[1]] || mHist[1];
        const year = url.searchParams.get('year');
        const sport = url.searchParams.get('sport');
        const school = url.searchParams.get('school');
        let q = 'SELECT sport, sport_label, year, winner, runner_up FROM sport_history WHERE district_id = ?';
        const args = [districtId];
        if (year) { q += ' AND year = ?'; args.push(parseInt(year)); }
        if (sport) { q += ' AND sport = ?'; args.push(sport); }
        if (school) { q += ' AND (winner = ? OR runner_up = ?)'; args.push(school); args.push(school); }
        q += ' ORDER BY year DESC, sport';
        const r = await env.SSP_DB.prepare(q).bind(...args).all();
        return json({ ok: true, district_id: districtId, total: r.results?.length || 0, history: r.results || [] }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // /api/data/district/{id}/records — event records (athletics times, distances, etc.)
    let mRec = p.match(/^\/api\/data\/district\/([a-z0-9-]+)\/records$/);
    if (mRec && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const SLUG_ALIASES = {'wd':'williamstown-district','williamstown':'williamstown-district','hb':'hobsonsbay-district','hobsonsbay':'hobsonsbay-district','hobsons-bay':'hobsonsbay-district'};
        const districtId = SLUG_ALIASES[mRec[1]] || mRec[1];
        const sport = url.searchParams.get('sport');
        const ag = url.searchParams.get('age_group');
        let q = 'SELECT sport, event_name, age_group, gender, record_value, record_unit, athlete_name, athlete_school, year_set, verified, notes FROM event_records WHERE scope = ? AND scope_id = ?';
        const args = ['district', districtId];
        if (sport) { q += ' AND sport = ?'; args.push(sport); }
        if (ag) { q += ' AND age_group = ?'; args.push(ag); }
        q += ' ORDER BY sport, event_name, age_group, gender';
        const r = await env.SSP_DB.prepare(q).bind(...args).all();
        return json({ ok: true, district_id: districtId, total: r.results?.length || 0, records: r.results || [] }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // POST /api/data/district/{id}/records — convenor sets/updates a record (signed session required)
    if (mRec && request.method === 'POST') {
      try {
        const _sessUser = await _verifySession(request, env);
        if (!_sessUser) return json({ ok: false, error: 'unauthorized' }, 401, corsHeaders);
        const body = await request.json();
        const required = ['sport','event_name','age_group','gender','record_value','athlete_name','athlete_school','year_set'];
        for (const k of required) if (!body[k]) return json({ ok: false, error: 'missing field: ' + k }, 400, corsHeaders);
        const SLUG_ALIASES = {'wd':'williamstown-district','williamstown':'williamstown-district'};
        const districtId = SLUG_ALIASES[mRec[1]] || mRec[1];
        const num = parseFloat(body.record_value.replace(/[^0-9.]/g, ''));
        await env.SSP_DB.prepare(
          'INSERT INTO event_records (scope, scope_id, sport, event_name, age_group, gender, record_value, record_unit, numeric_value, athlete_name, athlete_school, year_set, date_set, source, verified, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(scope, scope_id, sport, event_name, age_group, gender) DO UPDATE SET record_value=excluded.record_value, numeric_value=excluded.numeric_value, athlete_name=excluded.athlete_name, athlete_school=excluded.athlete_school, year_set=excluded.year_set, date_set=excluded.date_set, verified=excluded.verified, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP'
        ).bind('district', districtId, body.sport, body.event_name, body.age_group, body.gender, body.record_value, body.record_unit || '', num || null, body.athlete_name, body.athlete_school, body.year_set, body.date_set || null, body.source || 'manual', body.verified ? 1 : 0, body.notes || null).run();
        return json({ ok: true, message: 'Record saved' }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // POST /api/internal/check-records — service-to-service record auto-update from carnival-results
    if (p === '/api/internal/check-records' && request.method === 'POST') {
      const secret = request.headers.get('X-Internal-Secret') || '';
      if (!env.INTERNAL_SECRET || secret !== env.INTERNAL_SECRET) {
        return json({ ok:false, error:'unauthorized' }, 401, corsHeaders);
      }
      try {
        const _clen = parseInt(request.headers.get('Content-Length')||'0',10);
        if (_clen > 200000) return json({ ok:false, error:'payload too large' }, 413, corsHeaders);
        const body = await request.json();
        const scope = body.scope; const scope_id = body.scope_id;
        const candidates = body.candidates || [];
        if (!scope || !scope_id || !candidates.length) return json({ ok:false, error:'missing scope/scope_id/candidates' }, 400, corsHeaders);
        const updates = [];
        for (const c of candidates) {
          const existing = await env.SSP_DB.prepare(
            'SELECT numeric_value, is_lower_better, record_value FROM event_records WHERE scope=? AND scope_id=? AND sport=? AND event_name=? AND age_group=? AND gender=?'
          ).bind(scope, scope_id, c.sport, c.event_name, c.age_group, c.gender).first();
          const newVal = parseFloat(c.value_seconds);
          if (!isFinite(newVal)) continue;
          let beats = false;
          if (!existing || existing.numeric_value == null) {
            beats = true;
          } else {
            const lower = existing.is_lower_better !== 0;
            beats = lower ? (newVal < existing.numeric_value) : (newVal > existing.numeric_value);
          }
          if (beats) {
            await env.SSP_DB.prepare(
              'INSERT INTO event_records (scope, scope_id, sport, event_name, age_group, gender, record_value, record_unit, numeric_value, is_lower_better, athlete_name, athlete_school, year_set, date_set, source, verified, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(scope, scope_id, sport, event_name, age_group, gender) DO UPDATE SET record_value=excluded.record_value, numeric_value=excluded.numeric_value, athlete_name=excluded.athlete_name, athlete_school=excluded.athlete_school, year_set=excluded.year_set, date_set=excluded.date_set, source=excluded.source, verified=excluded.verified, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP'
            ).bind(scope, scope_id, c.sport, c.event_name, c.age_group, c.gender, c.value_str, c.record_unit||'seconds', newVal, 1, c.athlete_name||'', c.athlete_school||'', c.year||new Date().getFullYear(), c.date_set||null, c.source||'auto: carnival-results', 1, 'Auto-detected new record from live carnival results').run();
            updates.push({ event:c.event_name, age:c.age_group, gender:c.gender, value:c.value_str, athlete:c.athlete_name, beats: existing ? existing.record_value : null });
          }
        }
        return json({ ok:true, updates_count: updates.length, updates }, 200, corsHeaders);
      } catch (e) { return json({ ok:false, error:e.message }, 500, corsHeaders); }
    }

    // /api/data/{scope}/{slug}/news — public announcements
    let mNews = p.match(/^\/api\/data\/(school|district|division)\/([a-z0-9-]+)\/news$/);
    if (mNews && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const SLUG = {'wd':'williamstown-district','williamstown':'williamstown-district','hb':'hobsonsbay-division','hobsonsbay':'hobsonsbay-division','hobsons-bay':'hobsonsbay-division','wyndham':'wyndham-division','wps':'williamstown-primary','williamstownprimary':'williamstown-primary'};
        const scope = mNews[1];
        const scope_id = SLUG[mNews[2]] || mNews[2];
        const r = await env.SSP_DB.prepare(
          'SELECT id, title, body, category, pinned, expires_at, created_at FROM announcements WHERE scope=? AND scope_id=? AND active=1 AND (expires_at IS NULL OR expires_at = \'\' OR expires_at >= date(\'now\')) ORDER BY pinned DESC, created_at DESC LIMIT 10'
        ).bind(scope, scope_id).all();
        return json({ ok: true, scope, scope_id, total: r.results?.length || 0, news: r.results || [] }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // /api/data/school/{slug}/sports — sport list with coordinators
    let mSports = p.match(/^\/api\/data\/school\/([a-z0-9-]+)\/sports$/);
    if (mSports && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const ALIASES = {'wps':'williamstownprimary','williamstown-primary':'williamstownprimary','williamstownprimary':'williamstownprimary'};
        const school_id = ALIASES[mSports[1]] || mSports[1];
        const r = await env.SSP_DB.prepare(
          'SELECT sport_code, sport_label, coordinator_name, coordinator_email FROM school_sports WHERE school_id=? AND active=1 ORDER BY display_order, sport_label'
        ).bind(school_id).all();
        return json({ ok: true, school_id, total: r.results?.length || 0, sports: r.results || [] }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // /api/data/school/{slug}/branding — public branding info
    let mBrand = p.match(/^\/api\/data\/school\/([a-z0-9-]+)\/branding$/);
    if (mBrand && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const ALIASES = {'wps':'williamstownprimary','williamstown-primary':'williamstownprimary','williamstownprimary':'williamstownprimary'};
        const school_id = ALIASES[mBrand[1]] || mBrand[1];
        const r = await env.SSP_DB.prepare(
          'SELECT id, name, suburb, state, principal, founded_year, school_motto, website_url, logo_url, primary_color, secondary_color, house_colors, year_levels, student_count FROM schools WHERE id=? AND active=1'
        ).bind(school_id).first();
        if (!r) return json({ ok: false, error: 'school not found' }, 404, corsHeaders);
        return json({ ok: true, branding: r }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // /api/data/school/{slug}/records — event records for a school
    let mSchRec = p.match(/^\/api\/data\/school\/([a-z0-9-]+)\/records$/);
    if (mSchRec && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const SCHOOL_ALIASES = {'wps':'williamstown-primary','williamstownprimary':'williamstown-primary','williamstown-ps':'williamstown-primary'};
        const schoolId = SCHOOL_ALIASES[mSchRec[1]] || mSchRec[1];
        const sport = url.searchParams.get('sport');
        const ag = url.searchParams.get('age_group');
        let q = 'SELECT sport, event_name, age_group, gender, record_value, record_unit, athlete_name, athlete_school, year_set, verified, notes FROM event_records WHERE scope = ? AND scope_id = ?';
        const args = ['school', schoolId];
        if (sport) { q += ' AND sport = ?'; args.push(sport); }
        if (ag) { q += ' AND age_group = ?'; args.push(ag); }
        q += ' ORDER BY sport, event_name, age_group, gender';
        const r = await env.SSP_DB.prepare(q).bind(...args).all();
        return json({ ok: true, school_id: schoolId, total: r.results?.length || 0, records: r.results || [] }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

    // /api/data/division/{id}/records — event records for a division
    let mDivRec = p.match(/^\/api\/data\/division\/([a-z0-9-]+)\/records$/);
    if (mDivRec && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const DIV_ALIASES = {'wd':'wyndham-division','wyndham':'wyndham-division','hb':'hobsonsbay-division','hobsonsbay':'hobsonsbay-division','hobsons-bay':'hobsonsbay-division'};
        const divisionId = DIV_ALIASES[mDivRec[1]] || mDivRec[1];
        const sport = url.searchParams.get('sport');
        const ag = url.searchParams.get('age_group');
        let q = 'SELECT sport, event_name, age_group, gender, record_value, record_unit, athlete_name, athlete_school, year_set, verified, notes FROM event_records WHERE scope = ? AND scope_id = ?';
        const args = ['division', divisionId];
        if (sport) { q += ' AND sport = ?'; args.push(sport); }
        if (ag) { q += ' AND age_group = ?'; args.push(ag); }
        q += ' ORDER BY sport, event_name, age_group, gender';
        const r = await env.SSP_DB.prepare(q).bind(...args).all();
        return json({ ok: true, division_id: divisionId, total: r.results?.length || 0, records: r.results || [] }, 200, corsHeaders);
      } catch (e) { return json({ ok: false, error: e.message }, 500, corsHeaders); }
    }

        // /api/data/district/{id}/teams — list teams for a district / sport / year
    let mTeams = p.match(/^\/api\/data\/district\/([a-z0-9-]+)\/teams$/);
    if (mTeams && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const sport = url.searchParams.get('sport');
        const year = parseInt(url.searchParams.get('year')) || 2026;
        // Slug aliases — accept short codes (wd) and hyphenated forms
        const SLUG_ALIASES = {
          'wd': 'williamstown-district',
          'williamstown': 'williamstown-district',
          'hb': 'hobsonsbay-district',
          'hobsonsbay': 'hobsonsbay-district',
          'hobsons-bay': 'hobsonsbay-district',
          'wyndham': 'wyndham-division',
          'wd-division': 'wyndham-division',
        };
        const districtId = SLUG_ALIASES[mTeams[1]] || mTeams[1];
        let q = 'SELECT * FROM district_teams WHERE district_id = ? AND year = ?';
        const args = [districtId, year];
        if (sport) { q += ' AND sport = ?'; args.push(sport); }
        q += ' ORDER BY sport, school_name';
        const r = await env.SSP_DB.prepare(q).bind(...args).all();
        return json({ ok: true, district_id: districtId, year, sport, total: r.results?.length || 0, teams: r.results || [] });
      } catch (e) { return json({ ok: false, error: e.message }, 500); }
    }

    // /api/data/event/{slug}/entries — POST: add a team entry
    let mEnt = p.match(/^\/api\/data\/event\/([a-z0-9-]+)\/entries$/);
    if (mEnt && request.method === 'POST') {
        // Reject oversized payloads early
        const _clen = parseInt(request.headers.get('Content-Length') || '0', 10);
        if (_clen > 100000) return json({ ok: false, error: 'payload too large' }, 413, corsHeaders);
      try {
        const body = await request.json();
        body.event_id = mEnt[1];
        const result = await addEntry(env, body);
        return json({ ok: true, ...result });
      } catch (e) { return json({ ok: false, error: e.message }, 500); }
    }

    return json({ ok: false, error: 'Not found' }, 404);
  }
};
