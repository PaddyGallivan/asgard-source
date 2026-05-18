// ct-access — Carnival Timing access code management
// Routes:
//   POST /validate       — check if a code is valid (public)
//   POST /create         — create a code (PIN protected)
//   POST /stripe-webhook — Stripe event → generate code → email customer
//   GET  /admin/codes    — list recent codes (PIN protected)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Pin",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Generate a random human-friendly code: AAA-1234
function genCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O
  const digits  = "0123456789";
  const arr = crypto.getRandomValues(new Uint8Array(7));
  const L = (i) => letters[arr[i] % letters.length];
  const D = (i) => digits[arr[i] % digits.length];
  return `${L(0)}${L(1)}${L(2)}-${D(3)}${D(4)}${D(5)}${D(6)}`;
}

async function sendCodeEmail(env, to, code, type, school) {
  const isSSP = type === "ssp";
  const isAnnual = type === "annual";
  const typeLabel = isAnnual ? "Annual Unlimited (12 months)"
    : type === "single" ? "Single Carnival"
    : `School Sport Portal — ${school || "School"}`;
  const heading = isSSP ? `Welcome to School Sport Portal — ${school||"your school"}!`
    : isAnnual ? "You're all set for the year"
    : "Thanks — your code is ready";
  const subject = isSSP ? `Welcome — your School Sport Portal is live (${code})`
    : `Your Carnival Timing access code: ${code}`;
  const ctaUrl = isSSP ? "https://schoolsportportal.com.au/help" : "https://carnivaltiming.com/help";
  const ctaLabel = isSSP ? "Open your getting-started guide →" : "Read the quick-start guide →";
  const supportEmail = "hello@schoolsportportal.com.au";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc">
<div style="background:#fff;border-radius:14px;padding:36px;box-shadow:0 2px 12px rgba(0,0,0,.06)">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:2.2rem;line-height:1;margin-bottom:6px">🏁</div>
    <h1 style="font-size:1.4rem;color:#0d1b3e;margin:0 0 4px">${heading}</h1>
    <p style="color:#64748b;font-size:.9rem;margin:0">${typeLabel}</p>
  </div>
  <p style="font-size:1rem;line-height:1.6;color:#334155">Hi${school ? ` (${school})`:''},</p>
  <p style="font-size:1rem;line-height:1.6;color:#334155">${isSSP ? "Your school is now live on School Sport Portal. Use the access code below in Carnival Timing on race day — same code works for every carnival you run, all year." : "Thanks for your purchase. Here's your Carnival Timing access code:"}</p>
  <div style="background:linear-gradient(135deg,#0d1b3e,#1a3a6e);border-radius:14px;padding:28px;text-align:center;margin:28px 0">
    <div style="color:rgba(255,255,255,.6);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px">Your access code</div>
    <div style="font-size:2.2rem;font-weight:900;letter-spacing:.18em;color:#fcd34d;font-family:monospace">${code}</div>
    <div style="color:rgba(255,255,255,.7);margin-top:10px;font-size:.85rem">${typeLabel}</div>
  </div>
  <h2 style="font-size:1rem;font-weight:700;color:#0d1b3e;margin:24px 0 8px">Next steps</h2>
  <ol style="color:#475569;line-height:1.8;font-size:.95rem;padding-left:22px;margin:0">
    <li>Open <a href="https://carnivaltiming.com" style="color:#1a56db;font-weight:600">carnivaltiming.com</a> on a phone or tablet.</li>
    <li>Tap <strong>New Carnival</strong> and paste your code <code style="background:#eff6ff;padding:2px 6px;border-radius:4px;font-size:.85rem">${code}</code>.</li>
    <li>${isSSP ? `Add your students once at <a href="https://schoolsportportal.com.au/help" style="color:#1a56db;font-weight:600">/help</a> — they'll auto-populate every future carnival.` : "Set up your event program (events, age groups, houses) and you're ready."}</li>
    <li>On race day: tap finishers as they cross the line. Results stream live to your school's public page.</li>
  </ol>
  <div style="text-align:center;margin:32px 0 16px">
    <a href="${ctaUrl}" style="display:inline-block;background:#1a56db;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:.95rem">${ctaLabel}</a>
  </div>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px">
  <p style="font-size:.85rem;color:#475569;line-height:1.6;margin:0">Questions or need a hand? Just reply to this email — it goes straight to Paddy. Or write to <a href="mailto:${supportEmail}" style="color:#1a56db">${supportEmail}</a>.</p>
</div>
<p style="text-align:center;font-size:.7rem;color:#94a3b8;margin-top:18px">School Sport Portal · Luck Dragon Pty Ltd · ABN 64 697 434 898 · <a href="https://schoolsportportal.com.au/privacy" style="color:#94a3b8">Privacy</a></p>
</body></html>`;

  const body = {
    from: "School Sport Portal <noreply@luckdragon.io>",
    reply_to: "hello@schoolsportportal.com.au",
    to: [to],
    subject,
    html,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}


const _SEC_HEADERS_CT_ACCESS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-Robots-Tag': 'noindex, nofollow'
};
const _innerExport_ct_access = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // ── GET /health — public status (no auth) ─────────────────────────
    if (path === "/health" || path === "/") {
      return json({ ok: true, worker: "ct-access", version: "1.1.0", routes: ["/validate", "/create", "/strip", "/stripe-webhook", "/admin/codes"] });
    }

    // ── POST /validate ───────────────────────────────────────────────
    if (path === "/validate" && request.method === "POST") {
      const { code } = await request.json().catch(() => ({}));
      if (!code) return json({ valid: false, error: "No code provided" }, 400);

      const key = `code:${code.toUpperCase().trim()}`;
      const raw = await env.CT_ACCESS_CODES.get(key);
      if (!raw) return json({ valid: false, error: "Invalid code" });

      const data = JSON.parse(raw);
      const now = Date.now();

      // Check expiry
      if (data.expires && now > data.expires) {
        return json({ valid: false, error: "Code expired" });
      }

      // Check uses for single carnival
      if (data.type === "single" && data.uses_left <= 0) {
        return json({ valid: false, error: "Code already used" });
      }

      // Consume a single-carnival use
      if (data.type === "single") {
        data.uses_left -= 1;
        await env.CT_ACCESS_CODES.put(key, JSON.stringify(data));
      }

      return json({
        valid: true,
        type: data.type,
        school: data.school || null,
        expires: data.expires || null,
        message: data.type === "annual" ? "Annual unlimited access"
          : data.type === "ssp" ? `School Sport Portal — ${data.school}`
          : "Single carnival access",
      });
    }

    // ── POST /create (admin, PIN protected) ──────────────────────────
    if (path === "/create" && request.method === "POST") {
      const pin = request.headers.get("X-Pin");
      if (pin !== env.ADMIN_PIN) return json({ error: "Unauthorized" }, 401);

      const { type, school, email, custom_code } = await request.json().catch(() => ({}));
      if (!["single", "annual", "ssp"].includes(type)) {
        return json({ error: "type must be single|annual|ssp" }, 400);
      }

      const code = custom_code || genCode();
      const key = `code:${code}`;
      const now = Date.now();

      const data = {
        type,
        school: school || null,
        email: email || null,
        created: now,
        expires: type === "annual" ? now + 365 * 24 * 60 * 60 * 1000
          : type === "ssp" ? null // never expires
          : null, // single: no time expiry, uses_left controls it
        uses_left: type === "single" ? 1 : null,
      };

      await env.CT_ACCESS_CODES.put(key, JSON.stringify(data), {
        expirationTtl: type === "annual" ? 366 * 86400
          : type === "single" ? 180 * 86400 // 6 months to be safe
          : undefined, // ssp: never expires
      });

      // Send email if provided
      if (email) {
        await sendCodeEmail(env, email, code, type, school);
      }

      return json({ code, type, school, expires: data.expires });
    }

    // ── POST /stripe-webhook ─────────────────────────────────────────
    if (path === "/stripe-webhook" && request.method === "POST") {
      const body = await request.text();
      const sig = request.headers.get("stripe-signature");
      if (!sig) {
        return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
      }

      // Verify Stripe signature
      let event;
      try {
        // Simple timestamp + signature check
        const parts = sig.split(",").reduce((acc, p) => {
          const [k, v] = p.split("=");
          acc[k] = v;
          return acc;
        }, {});
        const payload = `${parts.t}.${body}`;
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sig_bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
        const computed = Array.from(new Uint8Array(sig_bytes)).map(b => b.toString(16).padStart(2, "0")).join("");
        if (computed !== parts.v1) {
          return json({ error: "Invalid signature" }, 400);
        }
        event = JSON.parse(body);
      } catch (e) {
        return json({ error: "Webhook error: " + e.message }, 400);
      }

      if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
        const session = event.data.object;
        const email = session.customer_details?.email || session.receipt_email || null;
        const ct_type = session.metadata?.ct_type || "single";

        const code = genCode();
        const key = `code:${code}`;
        const now = Date.now();

        const data = {
          type: ct_type,
          email,
          created: now,
          expires: ct_type === "annual" ? now + 365 * 24 * 60 * 60 * 1000 : null,
          uses_left: ct_type === "single" ? 1 : null,
          stripe_session: session.id,
        };

        await env.CT_ACCESS_CODES.put(key, JSON.stringify(data), {
          expirationTtl: ct_type === "annual" ? 366 * 86400 : 180 * 86400,
        });

        if (email) {
          await sendCodeEmail(env, email, code, ct_type, null);
        }
      }

      return json({ received: true });
    }

    // ── GET /admin/codes ─────────────────────────────────────────────
    if (path === "/admin/codes" && request.method === "GET") {
      const pin = request.headers.get("X-Pin");
      if (pin !== env.ADMIN_PIN) return json({ error: "Unauthorized" }, 401);
      const list = await env.CT_ACCESS_CODES.list({ prefix: "code:", limit: 100 });
      return json({ codes: list.keys.map(k => k.name.replace("code:", "")) });
    }


    // ── DELETE /admin/codes/:code ────────────────────────────────────
    if (path.startsWith("/admin/codes/") && request.method === "DELETE") {
      const pin = request.headers.get("X-Pin");
      if (pin !== env.ADMIN_PIN) return json({ error: "Unauthorized" }, 401);
      const code = decodeURIComponent(path.replace("/admin/codes/", ""));
      if (!code) return json({ error: "Missing code" }, 400);
      await env.CT_ACCESS_CODES.delete("code:" + code);
      return json({ deleted: code });
    }

    return json({ error: "Not found" }, 404);
  },
};

export default {
  async fetch(req, env, ctx) {
    const _r = await _innerExport_ct_access.fetch(req, env, ctx);
    if (!_r) return _r;
    const _w = new Response(_r.body, _r);
    for (const [k, v] of Object.entries(_SEC_HEADERS_CT_ACCESS)) _w.headers.set(k, v);
    return _w;
  }
};