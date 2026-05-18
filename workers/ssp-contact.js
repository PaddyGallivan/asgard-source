// ssp-contact - PATCHED 2026-05-14
// Fix: /health returned 405 because the original handler rejected
// everything except POST/OPTIONS before checking the path.
// This version answers GET /health early, then keeps the POST-only
// gate for the /contact endpoint.
// Deploy with: wrangler deploy ssp-contact-patched.js --name ssp-contact
// (or paste into the Cloudflare dashboard -> ssp-contact -> Quick edit)

const _SSP_CONTACT_SEC_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'X-Robots-Tag': 'noindex, nofollow'
};

async function handleRequestWrapped(request) {
  const r = await handleRequest(request);
  const w = new Response(r.body, r);
  for (const [k, v] of Object.entries(_SSP_CONTACT_SEC_HEADERS)) w.headers.set(k, v);
  return w;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequestWrapped(event.request));
});

const ALLOWED_ORIGINS = [
  "https://schoolsportportal.com.au",
  "https://www.schoolsportportal.com.au"
];
const SSP_PRICE_ID = "price_1TTcFlAm8bVflPN0biv8zblH";
const SSP_SUCCESS_URL = "https://schoolsportportal.com.au/thanks";
const SSP_CANCEL_URL = "https://schoolsportportal.com.au/#pricing";

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(school|primary|ps|ss|college|academy|state|the|and|of|at|st|saint)\b/g, "")
    .replace(/\s+/g, "")
    .slice(0, 40) || "school";
}

async function handleRequest(request) {
  const url = new URL(request.url);

  // === NEW: health endpoint (fixes fleet audit 405) ===
  if (url.pathname === "/health") {
    return new Response(
      JSON.stringify({
        ok: true,
        worker: "ssp-contact",
        version: "2026-05-14",
        endpoints: ["POST /", "GET /health"]
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  // === end new ===

  const origin = request.headers.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin);
  const cors = {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (origin && !allowed) {
    return new Response(
      JSON.stringify({ ok: false, error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const { name, email, school, role, students, message, website } = body;

  // === Rate limit: per-IP 60s sliding window ===
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  const rlKey = "https://rl.local/contact/" + encodeURIComponent(clientIp);
  try {
    const cached = await caches.default.match(rlKey);
    if (cached) {
      return new Response(
        JSON.stringify({ ok: false, error: "Too many requests. Please wait a minute and try again." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
    // Store empty entry with 60s TTL
    await caches.default.put(rlKey, new Response("ok", { headers: { "Cache-Control": "max-age=60" } }));
  } catch (_) { /* rate limit best-effort */ }

  // Honeypot
  if (website) {
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  if (!name || !email || !school) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing required fields" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid email address" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const clean = (s, max) => String(s || "").trim().slice(0, max);
  const safeName = clean(name, 100);
  const safeEmail = clean(email, 200);
  const safeSchool = clean(school, 200);
  const safeRole = clean(role, 100);
  const safeStudents = clean(students, 20);
  const safeMessage = clean(message, 1000);
  const studentCount = parseInt(safeStudents) || 0;
  const schoolId = slugify(safeSchool);

  let checkoutUrl = null;
  if (typeof STRIPE_SECRET_KEY !== "undefined" && STRIPE_SECRET_KEY && studentCount > 0) {
    try {
      const stripeBody = new URLSearchParams({
        "mode": "payment",
        "success_url": SSP_SUCCESS_URL,
        "cancel_url": SSP_CANCEL_URL,
        "customer_email": safeEmail,
        "line_items[0][price]": SSP_PRICE_ID,
        "line_items[0][quantity]": String(studentCount),
        "metadata[school_id]": schoolId,
        "metadata[school_name]": safeSchool,
        "metadata[school_email]": safeEmail,
        "metadata[student_count]": String(studentCount)
      });
      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + STRIPE_SECRET_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: stripeBody.toString()
      });
      if (stripeRes.ok) {
        const session = await stripeRes.json();
        checkoutUrl = session.url;
      } else {
        console.error("Stripe error:", await stripeRes.text());
      }
    } catch (stripeEx) {
      console.error("Stripe exception:", stripeEx);
    }
  }

  const internalBody = [
    "New demo request — School Sport Portal",
    "",
    "Name:     " + safeName,
    "Email:    " + safeEmail,
    "School:   " + safeSchool,
    "School ID: " + schoolId,
    "Role:     " + (safeRole || "—"),
    "Students: " + (safeStudents || "—"),
    "Message:  " + (safeMessage || "—"),
    "",
    checkoutUrl ? "Checkout URL: " + checkoutUrl : "(no checkout — student count missing or Stripe not configured)",
    "",
    "Sent from schoolsportportal.com.au"
  ].join("\n");

  const notifyRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + RESEND_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "School Sport Portal <onboarding@resend.dev>",
      to: ["pgallivan@outlook.com"],
      reply_to: safeEmail,
      subject: "Demo request — " + safeSchool,
      text: internalBody
    })
  });

  if (!notifyRes.ok) {
    const resendErr = await notifyRes.text();
    console.error("Resend notify error:", resendErr);
    return new Response(
      JSON.stringify({ ok: false, error: "Email send failed", detail: resendErr.slice(0, 400), status: notifyRes.status }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const nextStepsHtml = checkoutUrl
    ? `<p>Ready to get started? Your school has <strong>${studentCount} students</strong> — that's <strong>$${studentCount} for the full year</strong> (just $1/student).</p><p style="text-align:center;margin:24px 0"><a href="${checkoutUrl}" style="background:#00a86b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">Pay Now &amp; Get Started →</a></p>`
    : `<p>We'll be in touch shortly with your personalised setup link and payment details.</p>`;

  const autoReplyHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;color:#1e293b"><div style="text-align:center;padding:24px 0 32px"><div style="font-size:2rem">🏫</div><h1 style="font-size:1.4rem;color:#1e3a8a;margin:8px 0 4px">School Sport Portal</h1><p style="color:#64748b;font-size:.9rem;margin:0">schoolsportportal.com.au</p></div><p>Hi ${safeName},</p><p>Thanks for your interest in School Sport Portal! We've received your request for <strong>${safeSchool}</strong>.</p>${nextStepsHtml}<p>Any questions? Just reply to this email.</p><p>Cheers,<br><strong>Paddy</strong><br>Luck Dragon Pty Ltd</p></body></html>`;

  // Auto-reply disabled until Resend domain verification (see resend.com/domains).
  // Paddy will reply manually to the user's email captured in reply_to of the notify email.

  return new Response(
    JSON.stringify({ ok: true, checkoutUrl }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
}