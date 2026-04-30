// falkor-school v1.0.0 — Williamstown Primary School PE Agent
// Context: Paddy is a PE teacher at WPS, Melbourne
// Endpoints:
//   GET  /summary         — context for Falkor agent (weather + upcoming events)
//   POST /lesson-plan     — AI-generated PE lesson plan
//   GET  /weather         — current conditions at WPS (via asgard-ai)
//   GET  /health          — version check

const VERSION = '1.0.0';
const WORKER_NAME = 'falkor-school';
const WPS_LAT = -37.8594;
const WPS_LON = 144.8750;
const AI_URL = 'https://asgard-ai.luckdragon.io';
const BRAIN_URL = 'https://falkor-brain.luckdragon.io';

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

    // ── Weather for WPS ─────────────────────────────────────────────────────
    if (path === '/weather') {
      const r = await fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      });
      if (!r.ok) return json({ ok: false, error: 'Weather fetch failed' }, 502);
      const d = await r.json();
      return json(d);
    }

    // ── Summary for Falkor agent injection ───────────────────────────────────
    if (path === '/summary') {
      const weather = await fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const c = weather?.current;
      const today = weather?.today;

      return json({
        ok: true,
        school: 'Williamstown Primary School',
        teacher: 'Paddy Gallivan — PE',
        location: `${WPS_LAT}, ${WPS_LON}`,
        weather: weather ? {
          temp: c.temp,
          feels_like: c.feels_like,
          condition: c.condition,
          uv: c.uv,
          wind_kmh: c.wind_kmh,
          rain_chance: c.rain_chance,
          max: today?.max,
          min: today?.min,
        } : null,
        pe_suitable: weather?.pe_suitable ?? null,
        pe_note: weather?.pe_note ?? 'Weather unavailable',
        curriculum_areas: Object.keys(PE_CURRICULUM),
        tip: weather?.pe_suitable === false
          ? `⚠️ Consider indoor alternatives: ${PE_CURRICULUM.fitness[0]}, ${PE_CURRICULUM.games[0]}`
          : '✅ Good day for outdoor PE',
      });
    }

    // ── AI-generated Lesson Plan ─────────────────────────────────────────────
    if (path === '/lesson-plan' && method === 'POST') {
      if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: 'ANTHROPIC_API_KEY missing' }, 500);

      const body = await request.json().catch(() => ({}));
      const { year_level, duration = 45, focus, outdoor } = body;

      // Fetch current weather for context
      const weather = await fetch(`${AI_URL}/weather?lat=${WPS_LAT}&lon=${WPS_LON}`, {
        headers: { 'X-Pin': env.AGENT_PIN || '' }
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      const weatherNote = weather
        ? `Current: ${weather.current.temp}°C, ${weather.current.condition}, UV ${weather.current.uv}. ${weather.pe_note}`
        : 'Weather unavailable — assume indoor';

      const prompt = `Create a ${duration}-minute PE lesson plan for Williamstown Primary School.
Year level: ${year_level || 'Mixed (Foundation-6)'}
Focus: ${focus || 'General fitness and fundamental movement skills'}
Outdoor: ${outdoor !== false && weather?.pe_suitable !== false ? 'Yes — outdoor lesson' : 'No — indoor hall'}
Weather: ${weatherNote}

Structure the plan with:
1. Warm-up (5-8 min)
2. Skill focus / main activity (20-25 min)
3. Game / application (10-15 min)
4. Cool-down (3-5 min)
5. Learning outcomes (AusVELS links)

Keep it practical and fun. List any equipment needed.`;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!resp.ok) return json({ ok: false, error: 'AI failed: ' + resp.status }, 502);
      const data = await resp.json();
      const plan = data.content?.[0]?.text || '';

      // Store in brain for future reference
      await fetch(`${BRAIN_URL}/remember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pin': env.AGENT_PIN || '' },
        body: JSON.stringify({
          text: `PE Lesson Plan (${year_level || 'Mixed'}, ${duration}min, ${focus || 'general'}): ${plan.slice(0, 500)}`,
          category: 'school',
          tags: ['pe', 'lesson-plan', 'wps'],
        }),
      }).catch(() => {});

      return json({
        ok: true,
        plan,
        weather_note: weatherNote,
        year_level: year_level || 'Mixed',
        duration,
        outdoor: outdoor !== false && weather?.pe_suitable !== false,
      });
    }

    return json({ error: 'Not found', path }, 404);
  },
};
