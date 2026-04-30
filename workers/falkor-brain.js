// falkor-brain v1.0.0 — Personal Memory + RAG layer for Falkor
// Vectorize index: falkor-memory (384-dim cosine, CF Workers AI embeddings)
// D1: asgard-prod (facts metadata table)
//
// Endpoints:
//   POST /remember          — embed + store a fact/document
//   POST /recall            — semantic search + RAG answer
//   GET  /facts             — list all stored facts (paginated)
//   DELETE /facts/:id       — remove a fact
//   POST /summarize         — summarize recent context for agent injection
//   POST /ingest/url        — fetch URL and store as knowledge
//   POST /ingest/text       — store raw text knowledge
//   GET  /health            — version + index stats
//
// Bindings needed:
//   VECTORIZE: falkor-memory index
//   DB: asgard-prod D1 database
//   AI: Workers AI (for @cf/baai/bge-small-en-v1.5 embeddings + generation)
//   ANTHROPIC_API_KEY: secret (for high-quality summarization)

const VERSION = '1.0.0';
const WORKER_NAME = 'falkor-brain';
const EMBED_MODEL = '@cf/baai/bge-small-en-v1.5';
const GEN_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function err(msg, status = 400) { return json({ ok: false, error: msg }, status); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }

function pinOk(request, env) {
  const pin = request.headers.get('X-Pin') || '';
  if (!env.AGENT_PIN) return true;
  return pin === env.AGENT_PIN;
}

// ─── Embedding via CF Workers AI ─────────────────────────────────────────────
async function embed(text, env) {
  if (!env.AI) throw new Error('AI binding missing');
  const result = await env.AI.run(EMBED_MODEL, { text: [text.slice(0, 2048)] });
  return result.data[0]; // Float32Array / array of numbers
}

// ─── Ensure facts table exists ────────────────────────────────────────────────
async function ensureSchema(env) {
  if (!env.DB) return;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS falkor_facts (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      summary TEXT,
      category TEXT DEFAULT 'general',
      source TEXT,
      tags TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )
  `).run().catch(() => {});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // ── Health ──────────────────────────────────────────────────────────────
    if (path === '/health') {
      let vectorize_ok = false, db_ok = false, ai_ok = false;
      try { if (env.VECTORIZE) { await env.VECTORIZE.describe(); vectorize_ok = true; } } catch {}
      try { if (env.DB) { await env.DB.prepare('SELECT 1').run(); db_ok = true; } } catch {}
      ai_ok = !!env.AI;
      return json({ ok: true, worker: WORKER_NAME, version: VERSION, vectorize: vectorize_ok, db: db_ok, ai: ai_ok });
    }

    if (!pinOk(request, env)) return err('Unauthorized', 401);

    await ensureSchema(env);

    // ── Remember: embed + store a fact ──────────────────────────────────────
    if (path === '/remember' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { text, category = 'general', source, tags = [] } = body;
      if (!text) return err('text required');

      const id = uid();
      // Generate embedding
      let vector;
      try { vector = await embed(text, env); } catch (e) { return err('Embedding failed: ' + e.message, 500); }

      // Store in Vectorize
      await env.VECTORIZE.upsert([{
        id,
        values: vector,
        metadata: { category, source: source || '', tags: (tags || []).join(','), preview: text.slice(0, 200) },
      }]);

      // Store full text in D1
      if (env.DB) {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO falkor_facts (id, content, category, source, tags, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())`
        ).bind(id, text, category, source || '', JSON.stringify(tags)).run();
      }

      return json({ ok: true, id, category, chars: text.length });
    }

    // ── Recall: semantic search + optional RAG answer ────────────────────────
    if (path === '/recall' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { query, top_k = 5, answer = false, filter } = body;
      if (!query) return err('query required');

      // Embed the query
      let queryVector;
      try { queryVector = await embed(query, env); } catch (e) { return err('Embedding failed: ' + e.message, 500); }

      // Search Vectorize
      const searchOpts = { topK: top_k, returnMetadata: 'all', returnValues: false };
      if (filter) searchOpts.filter = filter;
      const results = await env.VECTORIZE.query(queryVector, searchOpts);

      // Fetch full text from D1
      let matches = [];
      if (env.DB && results.matches?.length) {
        const ids = results.matches.map(m => m.id);
        const placeholders = ids.map(() => '?').join(',');
        const rows = await env.DB.prepare(
          `SELECT id, content, category, source, tags, created_at FROM falkor_facts WHERE id IN (${placeholders})`
        ).bind(...ids).all();
        const rowMap = Object.fromEntries((rows.results || []).map(r => [r.id, r]));
        matches = results.matches.map(m => ({
          id: m.id,
          score: m.score,
          content: rowMap[m.id]?.content || m.metadata?.preview || '',
          category: m.metadata?.category || rowMap[m.id]?.category || 'general',
          source: m.metadata?.source || '',
        }));
      } else {
        matches = (results.matches || []).map(m => ({
          id: m.id, score: m.score,
          content: m.metadata?.preview || '',
          category: m.metadata?.category || 'general',
        }));
      }

      // Optional: generate RAG answer using CF Workers AI
      let ragAnswer = null;
      if (answer && matches.length > 0) {
        const context = matches.map((m, i) => `[${i+1}] ${m.content}`).join('\n\n');
        try {
          if (env.AI) {
            const resp = await env.AI.run(GEN_MODEL, {
              messages: [
                { role: 'system', content: 'You are Falkor, Paddy\'s personal AI. Answer using the provided context. Be concise.' },
                { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
              ],
              max_tokens: 512,
            });
            ragAnswer = resp.response || '';
          }
        } catch (e) { console.error('RAG generation error:', e?.message); }
      }

      return json({ ok: true, query, matches, rag_answer: ragAnswer, total: matches.length });
    }

    // ── Ingest text ─────────────────────────────────────────────────────────
    if (path === '/ingest/text' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { text, category = 'general', source, tags, chunk_size = 1500, overlap = 200 } = body;
      if (!text) return err('text required');

      // Split into overlapping chunks
      const chunks = [];
      let pos = 0;
      while (pos < text.length) {
        chunks.push(text.slice(pos, pos + chunk_size));
        pos += chunk_size - overlap;
      }

      const stored = [];
      for (const chunk of chunks) {
        if (chunk.trim().length < 50) continue;
        const id = uid();
        try {
          const vector = await embed(chunk, env);
          await env.VECTORIZE.upsert([{
            id, values: vector,
            metadata: { category, source: source || 'ingest', tags: (tags || []).join(','), preview: chunk.slice(0, 200) }
          }]);
          if (env.DB) {
            await env.DB.prepare(
              `INSERT OR REPLACE INTO falkor_facts (id, content, category, source, tags) VALUES (?,?,?,?,?)`
            ).bind(id, chunk, category, source || 'ingest', JSON.stringify(tags || [])).run();
          }
          stored.push(id);
        } catch (e) { console.error('Chunk error:', e?.message); }
      }
      return json({ ok: true, chunks_stored: stored.length, total_chars: text.length });
    }

    // ── Ingest URL ───────────────────────────────────────────────────────────
    if (path === '/ingest/url' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { url: targetUrl, category = 'web', tags } = body;
      if (!targetUrl) return err('url required');
      try {
        const resp = await fetch(targetUrl, { headers: { 'User-Agent': 'Falkor-Brain/1.0' } });
        if (!resp.ok) return err(`Fetch failed: ${resp.status}`);
        let text = await resp.text();
        // Strip HTML tags for plain text
        text = text.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
        text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50000);
        // Re-use ingest/text logic by internal call
        const ingestResp = await this.fetch(new Request(new URL('/ingest/text', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pin': request.headers.get('X-Pin') || '' },
          body: JSON.stringify({ text, category, source: targetUrl, tags })
        }), env);
        return ingestResp;
      } catch (e) { return err('URL fetch failed: ' + e.message, 502); }
    }

    // ── List facts ───────────────────────────────────────────────────────────
    if (path === '/facts' && method === 'GET') {
      if (!env.DB) return err('DB binding missing', 500);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const category = url.searchParams.get('category');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      let q = `SELECT id, substr(content,1,200) as preview, category, source, tags, created_at FROM falkor_facts`;
      const params = [];
      if (category) { q += ` WHERE category = ?`; params.push(category); }
      q += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      const rows = await env.DB.prepare(q).bind(...params).all();
      const countRow = await env.DB.prepare(`SELECT count(*) as c FROM falkor_facts${category ? ' WHERE category=?' : ''}`).bind(...(category ? [category] : [])).first();
      return json({ ok: true, facts: rows.results, total: countRow?.c || 0, limit, offset });
    }

    // ── Delete fact ───────────────────────────────────────────────────────────
    if (path.startsWith('/facts/') && method === 'DELETE') {
      const id = path.split('/facts/')[1];
      if (!id) return err('id required');
      if (env.DB) await env.DB.prepare(`DELETE FROM falkor_facts WHERE id = ?`).bind(id).run();
      await env.VECTORIZE.deleteByIds([id]).catch(() => {});
      return json({ ok: true, deleted: id });
    }

    // ── Summarize — create compressed context for agent injection ─────────────
    if (path === '/summarize' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { topic, max_facts = 10, category } = body;

      // If topic provided, use recall; otherwise get most recent
      let facts = [];
      if (topic) {
        const recallResp = await this.fetch(new Request(new URL('/recall', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Pin': request.headers.get('X-Pin') || '' },
          body: JSON.stringify({ query: topic, top_k: max_facts, answer: false })
        }), env);
        const rd = await recallResp.json();
        facts = rd.matches || [];
      } else if (env.DB) {
        const q = category
          ? `SELECT id, content, category FROM falkor_facts WHERE category=? ORDER BY created_at DESC LIMIT ?`
          : `SELECT id, content, category FROM falkor_facts ORDER BY created_at DESC LIMIT ?`;
        const params = category ? [category, max_facts] : [max_facts];
        const rows = await env.DB.prepare(q).bind(...params).all();
        facts = rows.results || [];
      }

      if (!facts.length) return json({ ok: true, summary: 'No relevant facts found.', count: 0 });

      const factsText = facts.map((f, i) => `${i+1}. [${f.category}] ${f.content || f.preview || ''}`).join('\n');

      let summary = factsText; // fallback = raw facts
      if (env.AI) {
        try {
          const resp = await env.AI.run(GEN_MODEL, {
            messages: [
              { role: 'system', content: 'You are Falkor, summarizing knowledge for context injection. Be concise and factual.' },
              { role: 'user', content: `Summarize these facts into a dense paragraph${topic ? ` relevant to: "${topic}"` : ''}:\n\n${factsText}` }
            ],
            max_tokens: 300,
          });
          summary = resp.response || factsText;
        } catch {}
      }

      return json({ ok: true, summary, count: facts.length, topic: topic || null });
    }

    return json({ error: 'Not found', path }, 404);
  },
};
