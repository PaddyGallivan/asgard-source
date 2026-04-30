// falkor-voice v1.0.1
// Phase 5 — Voice pipeline proxy for Falkor
// Proxies STT (asgard-ai /stt) and TTS (asgard-ai /speak)
// Adds Gemini text-turn endpoint for voice conversation context
//
// Env: VOICE_PIN, AI_URL, GEMINI_API_KEY, ELEVENLABS_VOICE_ID

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Pin, Upgrade',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors() });
    }

    const url     = new URL(request.url);
    const path    = url.pathname;
    const pin     = request.headers.get('X-Pin') || url.searchParams.get('pin') || '';
    const validPin = env.VOICE_PIN || '535554';
    const aiUrl   = env.AI_URL || 'https://asgard-ai.luckdragon.io';

    // ── /health — no auth ──────────────────────────────────────────
    if (path === '/health') {
      return json({
        status:   'ok',
        version:  '1.0.1',
        worker:   'falkor-voice',
        features: ['stt', 'tts', 'gemini-text'],
        tts:      'elevenlabs',
        stt:      'whisper-cf',
      });
    }

    // Auth
    if (pin !== validPin) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // ── POST /transcribe — STT via asgard-ai /stt ─────────────────
    if (path === '/transcribe' && request.method === 'POST') {
      try {
        const contentType = request.headers.get('Content-Type') || '';
        let formData;

        if (contentType.includes('multipart/form-data')) {
          formData = await request.formData();
        } else if (contentType.includes('application/json')) {
          const { audio_b64, mimeType = 'audio/webm' } = await request.json();
          const binary = atob(audio_b64);
          const bytes  = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          formData = new FormData();
          formData.append('audio', new Blob([bytes], { type: mimeType }), 'audio.webm');
        } else {
          const bytes = await request.arrayBuffer();
          formData = new FormData();
          formData.append('audio', new Blob([bytes], { type: contentType || 'audio/webm' }), 'audio.webm');
        }

        const res  = await fetch(`${aiUrl}/stt`, {
          method: 'POST',
          headers: { 'X-Pin': pin },
          body: formData,
        });
        const data = await res.json();

        return json({
          ok:         true,
          transcript: data.transcript || data.text || '',
          confidence: data.confidence || null,
          duration:   data.duration   || null,
        });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // ── POST /speak — TTS via asgard-ai /speak → audio/mpeg ───────
    if (path === '/speak' && request.method === 'POST') {
      try {
        const { text, voice_id, model } = await request.json();
        if (!text) return json({ error: 'text required' }, 400);

        const res = await fetch(`${aiUrl}/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pin': pin },
          body: JSON.stringify({
            text,
            voice_id: voice_id || env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
            model:    model    || 'eleven_turbo_v2_5',
          }),
        });

        if (!res.ok) {
          return json({ ok: false, error: await res.text() }, res.status);
        }

        const audio = await res.arrayBuffer();
        return new Response(audio, {
          headers: {
            'Content-Type':               'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control':              'no-cache',
          },
        });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // ── POST /chat — Gemini text conversation turn ─────────────────
    if (path === '/chat' && request.method === 'POST') {
      try {
        const { text, history = [], system } = await request.json();
        if (!text) return json({ error: 'text required' }, 400);

        const apiKey = env.GEMINI_API_KEY || '';
        const sysPrompt = system || 'You are Falkor, Paddy\'s personal AI assistant. Be concise, warm, and conversational — you are speaking aloud so avoid markdown.';

        const contents = [
          ...history.slice(-16).map(h => ({
            role:  h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text }] },
        ];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              system_instruction: { parts: [{ text: sysPrompt }] },
              contents,
              generationConfig: {
                maxOutputTokens: 400,
                temperature:     0.9,
                stopSequences:   [],
              },
            }),
          }
        );

        const data = await res.json();
        if (!res.ok) return json({ ok: false, error: data }, res.status);
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '[no reply]';

        return json({ ok: true, reply, model: 'gemini-2.0-flash-exp' });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    return json({ error: 'Not found', path }, 404);
  },
};
