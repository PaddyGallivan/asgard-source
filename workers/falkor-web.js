// falkor-web v1.0.0 — Web search + scraping sub-agent
// Uses Tavily API for search (key in asgard-ai secrets, proxied here)
// Falls back to Brave Search free tier
// Endpoints:
//   POST /search  — semantic web search, returns ranked results + snippets
//   POST /fetch   — fetch and extract clean text from a URL
//   GET  /health  — version check

const VERSION = '1.0.0';
const WORKER_NAME = 'falkor-web';
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/health') return json({ ok: true, worker: WORKER_NAME, version: VERSION, tavily: !!env.TAVILY_API_KEY });

    if (!pinOk(request, env)) return json({ ok: false, error: 'Unauthorized' }, 401);

    // ── Web Search ────────────────────────────────────────────────────────────
    if (path === '/search' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { query, max_results = 5, include_answer = true } = body;
      if (!query) return json({ ok: false, error: 'query required' }, 400);

      // Try Tavily first (best quality for AI agents)
      if (env.TAVILY_API_KEY) {
        try {
          const r = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: env.TAVILY_API_KEY,
              query,
              search_depth: 'basic',
              max_results,
              include_answer,
              include_domains: [],
              exclude_domains: [],
            }),
          });
          if (r.ok) {
            const d = await r.json();
            const results = (d.results || []).map(r => ({
              title: r.title,
              url: r.url,
              snippet: r.content?.slice(0, 300) || '',
              score: r.score,
            }));
            const answer = d.answer || '';

            // Optionally store search results in brain
            if (results.length > 0) {
              const summary = `Web search: "${query}" → ${answer || results[0]?.snippet || ''}`;
              await fetch(`${BRAIN_URL}/remember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Pin': env.AGENT_PIN || '' },
                body: JSON.stringify({ text: summary, category: 'web', tags: ['search'] }),
              }).catch(() => {});
            }

            return json({ ok: true, query, answer, results, provider: 'tavily', count: results.length });
          }
        } catch (e) { console.error('Tavily error:', e?.message); }
      }

      // Fallback: DuckDuckGo Instant Answer API (no key needed, limited)
      try {
        const ddg = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
        );
        if (ddg.ok) {
          const d = await ddg.json();
          const answer = d.AbstractText || d.Answer || '';
          const results = (d.RelatedTopics || []).slice(0, max_results).map(t => ({
            title: t.Text?.split(' - ')[0] || '',
            url: t.FirstURL || '',
            snippet: t.Text?.slice(0, 200) || '',
          }));
          return json({ ok: true, query, answer, results, provider: 'duckduckgo', count: results.length });
        }
      } catch (e) { console.error('DDG error:', e?.message); }

      return json({ ok: false, error: 'All search providers failed' }, 502);
    }

    // ── Fetch + extract URL text ───────────────────────────────────────────────
    if (path === '/fetch' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { url: targetUrl, store = false } = body;
      if (!targetUrl) return json({ ok: false, error: 'url required' }, 400);

      try {
        const r = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Falkor-Web/1.0 (AI assistant; +https://falkor.luckdragon.io)' },
          cf: { cacheEverything: false },
        });
        if (!r.ok) return json({ ok: false, error: `Fetch failed: ${r.status}` }, 502);

        const contentType = r.headers.get('Content-Type') || '';
        if (!contentType.includes('text') && !contentType.includes('json')) {
          return json({ ok: false, error: 'Non-text content type: ' + contentType }, 415);
        }

        let text = await r.text();

        // Strip HTML
        if (contentType.includes('html')) {
          text = text
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        const truncated = text.slice(0, 8000);

        // Optionally store in brain
        if (store) {
          await fetch(`${BRAIN_URL}/ingest/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Pin': env.AGENT_PIN || '' },
            body: JSON.stringify({ text: truncated, category: 'web', source: targetUrl }),
          }).catch(() => {});
        }

        return json({ ok: true, url: targetUrl, text: truncated, length: text.length, stored: store });
      } catch (e) {
        return json({ ok: false, error: 'Fetch error: ' + e?.message }, 502);
      }
    }

    return json({ error: 'Not found', path }, 404);
  },
};
