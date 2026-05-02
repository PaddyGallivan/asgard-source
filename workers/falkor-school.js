// falkor-school v1.2.0 — Phase 56: detailed PE outdoor advisor
// Williamstown Primary School PE Agent
// Endpoints:
//   GET  /summary         — context for Falkor agent (weather + upcoming events)
//   GET  /pe-advisor      — detailed outdoor/indoor recommendation with thresholds
//   POST /lesson-plan     — AI-generated PE lesson plan
//   GET  /weather         — current conditions at WPS (via asgard-ai)
//   GET  /calendar        — today's calendar events
//   GET  /health          — version check

const VERSION = '1.2.0';
const WORKER_NAME = 'falkor-school';
const WPS_LAT = -37.8594;
const WPS_LON = 144.8750;
const AI_URL = 'https://asgard-ai.luckdragon.io';
const BRAIN_URL = 'https://falkor-brain.luckdragon.io';
const CALENDAR_URL = 'https://falkor-calendar.luckdragon.io';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

function pinOk(request, env) {
  const pin = request.headers.get('X-Pin') || '';
  if (!env.AGENT_PIN) return true;
  return pin === env.AGENT_PIN;
}

const PE_CURRICULUM = {
  athletics: ['sprints 50m/100m', 'long jump', 'high jump', 'shot put', 'discus', 'relay'],
  games: ['basketball', 'netball', 'soccer', 'AFL', 'touch football', 'cricket', 'volleyball'],
  fitness: ['circuit training', 'beep test', 'yoga', 'gymnastics', 'swimming'],
  dance: ['creative movement', 'cultural dance', 'hip hop', 'aerobics'],
  outdoor: ['cross-country running', 'orienteering', 'fitness walk', 'adventure play'],
};

// PE outdoor suitability thresholds (DET/SunSmart guidelines for Victoria)
function assessPEConditions(w) {
  if (!w) return { suitable: null, reasons: [], indoor_alternatives: [], verdict: 'Weather data unavailable' };
  
  const issues = [];
  const warnings = [];
  
  const uv = w.uv || 0;
  const temp = w.temp || 20;
  const maxTemp = w.max || temp;
  const rainChance = w.rain_chance || 0;
  const windKmh = w.wind_kmh || 0;
  const condition = (w.condition || '').toLowerCase();
  
  // Hard stops
  if (uv >= 11) issues.push({ factor: 'UV', value: uv, threshold: '>=11', note: 'Extreme UV — cancel outdoor lesson, DET policy' });
  else if (uv >= 8) issues.push({ factor: 'UV', value: uv, threshold: '>=8', note: 'Very high UV — hats mandatory, limit sun exposure, consider indoor' });
  
  if (condition.includes('thunder') || condition.includes('storm')) issues.push({ factor: 'Lightning', value: condition, threshold: 'any', note: 'Thunderstorm — mandatory indoor (lightning risk)' });
  if (condition.includes('rain') || rainChance >= 70) issues.push({ factor: 'Rain', value: rainChance + '%', threshold: '>=70%', note: 'High rain probability — wet ground, slipping hazard' });
  if (maxTemp >= 35) issues.push({ factor: 'Heat', value: maxTemp + '°C', threshold: '>=35°C', note: 'Extreme heat — cancel outdoor, DET heat policy' });
  if (temp <= 5) issues.push({ factor: 'Cold', value: temp + '°C', threshold: '<=5°C', note: 'Very cold — hypothermia risk for students in minimal clothing' });
  if (windKmh >= 55) issues.push({ factor: 'Wind', value: windKmh + 'km/h', threshold: '>=55km/h', note: 'Dangerous wind speed — debris risk, cancel outdoor' });
  
  // Cautions (yellow flag — proceed with modifications)
  if (uv >= 6 && uv < 8) warnings.push({ factor: 'UV', value: uv, note: 'High UV — hats and sunscreen required, limit 11am-3pm exposure' });
  if (maxTemp >= 30 && maxTemp < 35) warnings.push({ factor: 'Heat', value: maxTemp + '°C', note: 'Hot day — ensure water breaks every 10-15min, shade nearby' });
  if (rainChance >= 40 && rainChance < 70) warnings.push({ factor: 'Rain chance', value: rainChance + '%', note: 'Some rain risk — have indoor backup plan ready' });
  if (windKmh >= 30 && windKmh < 55) warnings.push({ factor: 'Wind', value: windKmh + 'km/h', note: 'Strong wind — avoid throwing/kicking activities, use sheltered area' });
  
  const suitable = issues.length === 0;
  
  const indoor_alternatives = [
    'Circuit training in the gym',
    'Gymnastics / movement skills on mats',
    'Basketball skills (gym)',
    'Dance / creative movement',
    'Yoga and mindfulness',
    'Fitness challenges (hall)',
    'Beep test or pacer run (indoors)',
  ];
  
  let verdict = '';
  if (suitable && warnings.length === 0) {
    verdict = 'Good conditions for outdoor PE. No concerns.';
  } else if (suitable && warnings.length > 0) {
    verdict = 'Outdoor PE OK with precautions — see warnings above.';
  } else {
    verdict = 'Recommend indoor PE — ' + issues.map(i => i.factor).join(', ') + ' conditions not suitable.';
  }
  
  return { suitable, issues, warnings, indoor_alternatives: suitable ? [] : indoor_alternatives, verdict };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (path === '/health') {
      return json({ ok: true, worker: WORKER_NAME, version: VERSION });
    }

    if (!pinOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401);

    // ── Weather for WPS ───────────────────────────────────────────��─────────
    if (path === '/weather') {
      const r = await fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      });
      if (!r.ok) return json({ ok: false, error: 'Weather fetch failed' }, 502);
      return json(await r.json());
    }

    // ── PE Advisor — Phase 56 ─────────────────────────────────────────────────
    if (path === '/pe-advisor') {
      const weatherResp = await fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      }).catch(() => null);
      
      if (!weatherResp || !weatherResp.ok) {
        return json({ ok: false, error: 'Weather unavailable — assume indoor to be safe' });
      }
      
      const w = await weatherResp.json();
      const c = w.current || {};
      const today = w.today || {};
      
      const assessment = assessPEConditions({
        uv: c.uv,
        temp: c.temp,
        max: today.max || c.temp,
        rain_chance: c.rain_chance,
        wind_kmh: c.wind_kmh,
        condition: c.condition,
      });
      
      // Get this week's calendar to flag PE days
      const calResp = await fetch(`${CALENDAR_URL}/week`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      }).catch(() => null);
      const calData = calResp && calResp.ok ? await calResp.json().catch(() => ({})) : {};
      const weekEvents = (calData.events || []).filter(e => 
        (e.title || '').toLowerCase().includes('pe') ||
        (e.title || '').toLowerCase().includes('sport') ||
        (e.title || '').toLowerCase().includes('cross') ||
        (e.title || '').toLowerCase().includes('carnival')
      );
      
      return json({
        ok: true,
        school: 'Williamstown Primary School',
        date: new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Melbourne' }),
        current_conditions: {
          temp: c.temp,
          max: today.max,
          condition: c.condition,
          uv: c.uv,
          uv_category: c.uv >= 11 ? 'Extreme' : c.uv >= 8 ? 'Very High' : c.uv >= 6 ? 'High' : c.uv >= 3 ? 'Moderate' : 'Low',
          rain_chance: c.rain_chance,
          wind_kmh: c.wind_kmh,
        },
        recommendation: assessment.suitable ? 'OUTDOOR' : 'INDOOR',
        verdict: assessment.verdict,
        stop_factors: assessment.issues,
        caution_factors: assessment.warnings,
        indoor_alternatives: assessment.indoor_alternatives,
        pe_calendar_this_week: weekEvents,
        sunscreen_required: (c.uv || 0) >= 3,
        hat_required: (c.uv || 0) >= 6,
        water_breaks_required: (today.max || c.temp || 0) >= 28,
      });
    }

    // ── Summary for Falkor agent injection ───────────────────────────────────
    if (path === '/summary') {
      const [weatherResp, calResp] = await Promise.all([
        fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
          headers: { 'X-Pin': env.AGENT_PIN || '' }
        }).catch(() => null),
        fetch(`${CALENDAR_URL}/today`, {
          headers: { 'X-Pin': env.AGENT_PIN || '' }
        }).catch(() => null),
      ]);

      const weather = weatherResp && weatherResp.ok ? await weatherResp.json().catch(() => null) : null;
      const calData = calResp && calResp.ok ? await calResp.json().catch(() => null) : null;

      const c = weather?.current;
      const today = weather?.today;
      const calEvents = calData?.ok && calData?.events ? calData.events : [];
      
      const assessment = weather ? assessPEConditions({
        uv: c?.uv, temp: c?.temp, max: today?.max, rain_chance: c?.rain_chance, wind_kmh: c?.wind_kmh, condition: c?.condition
      }) : { suitable: null, verdict: 'Weather unavailable' };

      return json({
        ok: true,
        school: 'Williamstown Primary School',
        teacher: 'Paddy Gallivan — PE',
        weather: weather ? {
          temp: c.temp, feels_like: c.feels_like, condition: c.condition,
          uv: c.uv, wind_kmh: c.wind_kmh, rain_chance: c.rain_chance, max: today?.max, min: today?.min,
        } : null,
        pe_recommendation: assessment.suitable === null ? 'UNKNOWN' : assessment.suitable ? 'OUTDOOR' : 'INDOOR',
        pe_verdict: assessment.verdict,
        pe_note: assessment.verdict,
        pe_suitable: assessment.suitable,
        curriculum_areas: Object.keys(PE_CURRICULUM),
        calendar_today: calEvents,
        calendar_summary: calEvents.length > 0
          ? calEvents.map(e => e.allDay ? e.title : `${e.time}: ${e.title}`).join(', ')
          : 'No events today',
      });
    }

    // ── Calendar — proxy ─────────────────────────────────────────────────────
    if (path === '/calendar' || path === '/today' || path === '/week') {
      const calPath = path === '/calendar' ? '/today' : path;
      const r = await fetch(`${CALENDAR_URL}${calPath}`, { headers: { 'X-Pin': env.AGENT_PIN || '' } }).catch(() => null);
      if (!r || !r.ok) return json({ ok: false, error: 'Calendar unavailable' }, 502);
      return json(await r.json());
    }

    // ── AI Lesson Plan ───────────────────────────────────────────────────────
    if (path === '/lesson-plan' && method === 'POST') {
      if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: 'ANTHROPIC_API_KEY missing' }, 500);

      const body = await request.json().catch(() => ({}));
      const { year_level, duration = 45, focus, outdoor } = body;

      const weather = await fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const c = weather?.current;
      const assessment = weather ? assessPEConditions({
        uv: c?.uv, temp: c?.temp, max: weather?.today?.max, rain_chance: c?.rain_chance, wind_kmh: c?.wind_kmh, condition: c?.condition
      }) : { suitable: true };
      
      const goOutdoor = outdoor !== false && assessment.suitable;
      const weatherNote = weather
        ? `Current: ${c.temp}°C, ${c.condition}, UV ${c.uv}, wind ${c.wind_kmh}km/h. ${assessment.verdict}`
        : 'Weather unavailable — assume indoor';

      const prompt = `Create a ${duration}-minute PE lesson plan for Williamstown Primary School.
Year level: ${year_level || 'Mixed (Foundation-6)'}
Focus: ${focus || 'General fitness and fundamental movement skills'}
Setting: ${goOutdoor ? 'Outdoor lesson' : 'Indoor hall'}
Weather: ${weatherNote}
${!assessment.suitable && assessment.issues.length > 0 ? 'Reason for indoor: ' + assessment.issues.map(i => i.note).join('; ') : ''}

Structure:
1. Warm-up (5-8 min)
2. Skill focus / main activity (20-25 min)
3. Game / application (10-15 min)
4. Cool-down (3-5 min)
5. Learning outcomes (Victorian Curriculum links)

Keep it practical and fun for primary school. List equipment needed. No emojis.`;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
      });

      if (!resp.ok) return json({ ok: false, error: 'AI failed: ' + resp.status }, 502);
      const data = await resp.json();
      const plan = data.content?.[0]?.text || '';

      await fetch(`${BRAIN_URL}/remember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pin': env.AGENT_PIN || '' },
        body: JSON.stringify({ text: `PE Lesson Plan (${year_level || 'Mixed'}, ${duration}min, ${focus || 'general'}): ${plan.slice(0, 500)}`, category: 'school', tags: ['pe', 'lesson-plan', 'wps'] }),
      }).catch(() => {});

      return json({ ok: true, plan, weather_note: weatherNote, year_level: year_level || 'Mixed', duration, outdoor: goOutdoor, pe_verdict: assessment.verdict });
    }

    return json({ error: 'Not found', path }, 404);
  },
};
