// falkor-calendar v1.0.0
// Google Calendar ICS feed parser — no OAuth required
// Fetches secret ICS URL, parses events, returns structured JSON
// Deploy to: falkor-calendar.luckdragon.io
// Secret: GOOGLE_CAL_ICS_URL (set via CF secrets)
// Optional: GOOGLE_CAL_ICS_URL_2, _3 for multiple calendars

const VERSION = '1.0.0';
const AEST_OFFSET = 10 * 60; // AEST = UTC+10 (bump to 11 in daylight saving)

// ── ICS Parser ────────────────────────────────────────────────────────────────

function parseICS(text) {
  const events = [];
  const lines = text.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r\n|\n/);
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT' && current) {
      if (current.start) events.push(current);
      current = null;
    } else if (current) {
      const colon = line.indexOf(':');
      if (colon < 0) continue;
      const key = line.substring(0, colon).split(';')[0].toUpperCase();
      const val = line.substring(colon + 1);
      if (key === 'DTSTART') current.start = parseICSDate(line.substring(colon + 1), line);
      else if (key === 'DTEND')   current.end = parseICSDate(line.substring(colon + 1), line);
      else if (key === 'SUMMARY') current.title = val.replace(/\\n/g, ' ').replace(/\\,/g, ',').trim();
      else if (key === 'DESCRIPTION') current.description = val.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim();
      else if (key === 'LOCATION') current.location = val.replace(/\\,/g, ',').trim();
      else if (key === 'UID')     current.uid = val;
      else if (key === 'STATUS') current.status = val;
    }
  }
  return events;
}

function parseICSDate(val, fullLine) {
  // All-day: YYYYMMDD
  // DateTime: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
  val = val.trim();
  const isUTC = val.endsWith('Z');
  const clean = val.replace('Z','');
  if (clean.length === 8) {
    // All-day event
    const y = clean.substring(0,4), m = clean.substring(4,6), d = clean.substring(6,8);
    return { iso: `${y}-${m}-${d}`, allDay: true, ts: new Date(`${y}-${m}-${d}T00:00:00Z`).getTime() };
  }
  if (clean.length >= 15) {
    const y = clean.substring(0,4), mo = clean.substring(4,6), d = clean.substring(6,8);
    const h = clean.substring(9,11), min = clean.substring(11,13), s = clean.substring(13,15);
    const iso = `${y}-${mo}-${d}T${h}:${min}:${s}${isUTC ? 'Z' : '+10:00'}`;
    return { iso, allDay: false, ts: new Date(iso).getTime() };
  }
  return { iso: val, allDay: false, ts: 0 };
}

function toAEST(ts) {
  // Returns { date: 'YYYY-MM-DD', time: 'HH:MM', dayOfWeek: 'Monday' }
  const d = new Date(ts + AEST_OFFSET * 60 * 1000);
  const iso = d.toISOString();
  return {
    date: iso.substring(0, 10),
    time: iso.substring(11, 16),
    dayOfWeek: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()],
  };
}

function getAESTToday() {
  const now = Date.now() + AEST_OFFSET * 60 * 1000;
  return new Date(now).toISOString().substring(0, 10);
}

function filterEvents(events, targetDate) {
  return events
    .filter(e => {
      if (!e.start) return false;
      if (e.status === 'CANCELLED') return false;
      const startDate = e.start.allDay
        ? e.start.iso
        : toAEST(e.start.ts).date;
      return startDate === targetDate;
    })
    .sort((a, b) => (a.start.ts || 0) - (b.start.ts || 0))
    .map(e => {
      const start = e.start.allDay ? null : toAEST(e.start.ts);
      const end = e.end && !e.end.allDay ? toAEST(e.end.ts) : null;
      return {
        title: e.title || 'Untitled',
        allDay: e.start.allDay,
        time: start ? start.time : null,
        timeEnd: end ? end.time : null,
        location: e.location || null,
        description: e.description ? e.description.substring(0, 200) : null,
      };
    });
}

async function fetchCalendar(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Falkor/1.0 (luckdragon.io calendar agent)' },
    cf: { cacheTtl: 300, cacheEverything: false },
  });
  if (!resp.ok) throw new Error(`ICS fetch failed: ${resp.status}`);
  return resp.text();
}

// ── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://falkor.luckdragon.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === '/health') {
      const hasICS = !!(env.GOOGLE_CAL_ICS_URL);
      return json({ ok: true, version: VERSION, worker: 'falkor-calendar', calendar_configured: hasICS });
    }

    // PIN check
    const pin = request.headers.get('X-Pin') || url.searchParams.get('pin');
    if (pin !== env.AGENT_PIN) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    // ── GET /today ─────────────────────────────────────────────────────────
    if (url.pathname === '/today' || url.pathname === '/') {
      return handleEvents(env, 0);
    }

    // ── GET /tomorrow ──────────────────────────────────────────────────────
    if (url.pathname === '/tomorrow') {
      return handleEvents(env, 1);
    }

    // ── GET /week ──────────────────────────────────────────────────────────
    if (url.pathname === '/week') {
      return handleWeek(env);
    }

    // ── POST /summary — AI-powered natural language summary ────────────────
    if (url.pathname === '/summary' && request.method === 'POST') {
      return handleSummary(env, request);
    }

    return json({ ok: false, error: 'Not found' }, 404);
  },
};

async function getCalendarEvents(env, dayOffset = 0) {
  const icsUrls = [
    env.GOOGLE_CAL_ICS_URL,
    env.GOOGLE_CAL_ICS_URL_2,
    env.GOOGLE_CAL_ICS_URL_3,
  ].filter(Boolean);

  if (icsUrls.length === 0) {
    return { events: [], configured: false };
  }

  const nowMs = Date.now() + AEST_OFFSET * 60 * 1000;
  const targetDate = new Date(nowMs + dayOffset * 86400000).toISOString().substring(0, 10);

  const allEvents = [];
  for (const icsUrl of icsUrls) {
    try {
      const text = await fetchCalendar(icsUrl);
      const parsed = parseICS(text);
      const filtered = filterEvents(parsed, targetDate);
      allEvents.push(...filtered);
    } catch (e) {
      console.warn('Calendar fetch error:', e.message);
    }
  }

  // Sort combined events by time
  allEvents.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return -1; // all-day first
    if (!b.time) return 1;
    return a.time.localeCompare(b.time);
  });

  return { events: allEvents, configured: true, date: targetDate };
}

async function handleEvents(env, dayOffset) {
  const { events, configured, date } = await getCalendarEvents(env, dayOffset);
  if (!configured) {
    return json({ ok: true, configured: false, message: 'No calendar configured. Set GOOGLE_CAL_ICS_URL secret.', events: [] });
  }
  const label = dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : `in ${dayOffset} days`;
  return json({ ok: true, date, label, count: events.length, events });
}

async function handleWeek(env) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const { events, configured, date } = await getCalendarEvents(env, i);
    if (!configured) {
      return json({ ok: true, configured: false, events: [] });
    }
    if (events.length > 0) {
      days.push({ date, events });
    }
  }
  return json({ ok: true, days });
}

async function handleSummary(env, request) {
  const { date_offset = 0 } = await request.json().catch(() => ({}));
  const { events, configured, date } = await getCalendarEvents(env, date_offset);

  if (!configured) {
    return json({ ok: true, summary: 'No calendar connected yet.', events: [] });
  }

  if (events.length === 0) {
    const label = date_offset === 0 ? 'today' : 'tomorrow';
    return json({ ok: true, summary: `Nothing in the calendar for ${label}.`, events: [], date });
  }

  // Build natural language summary
  const label = date_offset === 0 ? 'Today' : date_offset === 1 ? 'Tomorrow' : date;
  const lines = events.map(e => {
    if (e.allDay) return `• ${e.title} (all day)`;
    const loc = e.location ? ` @ ${e.location}` : '';
    const end = e.timeEnd ? `–${e.timeEnd}` : '';
    return `• ${e.time}${end}${loc}: ${e.title}`;
  });
  const summary = `${label} you have ${events.length} event${events.length > 1 ? 's' : ''}:\n${lines.join('\n')}`;

  return json({ ok: true, summary, events, date });
}
