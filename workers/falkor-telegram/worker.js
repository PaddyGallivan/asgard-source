const VERSION = 'v1.3.0';
const AGENT_URL = 'https://falkor-agent.luckdragon.io';
const AI_URL    = 'https://asgard-ai.luckdragon.io';

function getUserId(from) {
  if (!from) return 'paddy';
  const u = (from.username || '').toLowerCase();
  const n = (from.first_name || '').toLowerCase();
  if (u.includes('jacky') || n.includes('jacky') || n.includes('jacqueline')) return 'jacky';
  if (u.includes('george') || n.includes('george')) return 'george';
  return 'paddy';
}

async function tgSend(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
}

async function askFalkor(agentPin, userId, message, chatId) {
  try {
    const res = await fetch(`${AGENT_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pin': agentPin },
      body: JSON.stringify({ message, userId, sessionId: `tg_${chatId}`, platform: 'telegram' })
    });
    if (!res.ok) return `Sorry, Falkor had a ${res.status} error. Try again!`;
    const d = await res.json();
    return d.reply || d.text || d.message || 'No response from Falkor.';
  } catch (e) {
    return `Connection error: ${e.message}`;
  }
}

// ── Analyse image via asgard-ai /chat/vision ─────────────────────────────────
async function analyseImage(token, fileId, mimeType, prompt, aiPin) {
  try {
    // Step 1: get Telegram file path
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result) return null;
    const filePath = fileData.result.file_path;

    // Step 2: download the file bytes
    const imgRes = await fetch(
      `https://api.telegram.org/file/bot${token}/${filePath}`
    );
    if (!imgRes.ok) return null;
    const imgBuffer = await imgRes.arrayBuffer();

    // Step 3: base64 encode
    const bytes = new Uint8Array(imgBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);

    // Step 4: call asgard-ai /chat/vision
    const visionRes = await fetch(`${AI_URL}/chat/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pin': aiPin },
      body: JSON.stringify({
        image_base64: b64,
        image_mime: mimeType,
        message: prompt || 'Describe this image in detail.',
        model: 'haiku',
      })
    });
    if (!visionRes.ok) {
      const errText = await visionRes.text().catch(() => '');
      console.error('Vision error:', visionRes.status, errText.slice(0, 200));
      return null;
    }
    const vd = await visionRes.json();
    return vd.reply || null;
  } catch (e) {
    console.error('analyseImage error:', e.message);
    return null;
  }
}

async function transcribeVoice(token, fileId, agentPin) {
  try {
    const fileRes = await fetch(
      'https://api.telegram.org/bot' + token + '/getFile?file_id=' + fileId
    );
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result) return null;
    const filePath = fileData.result.file_path;

    const audioRes = await fetch(
      'https://api.telegram.org/file/bot' + token + '/' + filePath
    );
    if (!audioRes.ok) return null;
    const audioBuffer = await audioRes.arrayBuffer();

    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
    form.append('audio', blob, 'voice.ogg');
    const sttRes = await fetch('https://asgard-ai.luckdragon.io/stt', {
      method: 'POST',
      headers: { 'X-Pin': agentPin },
      body: form
    });
    if (!sttRes.ok) return null;
    const sttData = await sttRes.json();
    return sttData.text || sttData.transcript || null;
  } catch (e) {
    return null;
  }
}

const SLASH_MAP = {
  '/afl':     'afl ladder and scores today',
  '/tip':     'show my tipping comp standings',
  '/racing':  'show racing tipping leaderboard',
  '/weather': 'what is the weather today',
  '/briefing':'give me my daily briefing',
  '/kbt':     'what kbt trivia events are coming up',
  '/pe':      'is it suitable for outdoor PE today at WPS?',
};

const HELP_TEXT = `<b>Falkor Commands</b>

/afl — AFL ladder and scores
/tip — Tipping comp standings
/racing — Racing tipping leaderboard
/weather — Current weather
/briefing — Daily briefing
/kbt — KBT trivia events
/pe — PE outdoor suitability
/help — This help message

Or ask me anything — including sending a photo for me to analyse.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        }
      });
    }

    if (path === '/health') {
      return new Response(JSON.stringify({
        ok: true, worker: 'falkor-telegram', version: VERSION,
        bot_configured: !!(env.TELEGRAM_BOT_TOKEN),
        agent_pin_set: !!(env.AGENT_PIN),
        vision_enabled: !!(env.AI_WORKER_PIN),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path === '/register-webhook' && method === 'POST') {
      if (request.headers.get('X-Pin') !== env.AGENT_PIN) {
        return new Response('Forbidden', { status: 403 });
      }
      const token = env.TELEGRAM_BOT_TOKEN;
      if (!token) return new Response(
        JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN not set' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
      const body = await request.json().catch(() => ({}));
      const webhookUrl = body.url || `https://falkor-telegram.luckdragon.io/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path === '/webhook' && method === 'POST') {
      const token = env.TELEGRAM_BOT_TOKEN;
      if (!token) return new Response('Bot token not configured', { status: 503 });

      let update;
      try { update = await request.json(); }
      catch { return new Response('Bad request', { status: 400 }); }

      const msg = update.message;
      if (!msg) return new Response('OK');

      const chatId   = msg.chat.id;
      const userId   = getUserId(msg.from);
      const agentPin = env.AGENT_PIN  || '';
      const aiPin    = env.AI_WORKER_PIN || env.AGENT_PIN || '';

      // ── Handle photo messages ─────────────────────────────────────────────
      if (msg.photo || (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('image/'))) {
        await tgSend(token, chatId, 'Analysing your image...');

        let fileId, mimeType;
        if (msg.photo) {
          // Telegram sends multiple sizes — pick the largest (last in array)
          const largest = msg.photo[msg.photo.length - 1];
          fileId   = largest.file_id;
          mimeType = 'image/jpeg';
        } else {
          fileId   = msg.document.file_id;
          mimeType = msg.document.mime_type;
        }

        // Caption becomes the vision prompt; fallback to generic describe
        const caption = (msg.caption || '').trim();
        const visionPrompt = caption
          ? `The user says: "${caption}". Analyse this image in that context. Be sharp and direct — Jarvis style.`
          : 'Describe this image clearly and concisely. Note anything interesting, unusual, or actionable. Be direct.';

        const description = await analyseImage(token, fileId, mimeType, visionPrompt, aiPin);

        if (!description) {
          await tgSend(token, chatId, 'Vision analysis failed — could not process that image. Try again or send a different one.');
        } else {
          const clean = description
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .substring(0, 4096);
          await tgSend(token, chatId, clean);
        }
        return new Response('OK');
      }

      // ── Handle voice notes ────────────────────────────────────────────────
      let text = msg.text ? msg.text.trim() : null;
      if (!text && msg.voice) {
        await tgSend(token, chatId, 'Transcribing voice note...');
        text = await transcribeVoice(token, msg.voice.file_id, agentPin);
        if (!text) {
          await tgSend(token, chatId, "Sorry, I couldn't transcribe that. Please try again.");
          return new Response('OK');
        }
        await tgSend(token, chatId, `<i>You said: ${text}</i>`);
      }
      if (!text) return new Response('OK');

      // Typing indicator (fire and forget)
      fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' })
      });

      // ── Slash commands ────────────────────────────────────────────────────
      if (text.startsWith('/')) {
        const cmdFull = text.split(' ')[0].split('@')[0].toLowerCase();
        const args    = text.split(' ').slice(1).join(' ');

        if (cmdFull === '/help' || cmdFull === '/start') {
          await tgSend(token, chatId, HELP_TEXT);
          return new Response('OK');
        }

        const mapped = SLASH_MAP[cmdFull];
        if (mapped) {
          const query = mapped + (args ? ' ' + args : '');
          const reply = await askFalkor(agentPin, userId, query, chatId);
          const clean = reply
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .substring(0, 4096);
          await tgSend(token, chatId, clean);
          return new Response('OK');
        }

        await tgSend(token, chatId, 'Unknown command. Try /help for options.');
        return new Response('OK');
      }

      // ── Plain text → falkor-agent ─────────────────────────────────────────
      const reply = await askFalkor(agentPin, userId, text, chatId);
      const clean = reply
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .substring(0, 4096);
      await tgSend(token, chatId, clean);
      return new Response('OK');
    }

    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
