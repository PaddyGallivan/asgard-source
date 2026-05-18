// sportportal-headers — strict-header overlay for sportportal.com.au
// Fronts the Pages canonical deployment, replaces response headers with policy-compliant set.
// 2026-05-18 — deploys without local wrangler.

const ORIGIN = 'https://sportportal.pages.dev';

const STRICT_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://static.cloudflareinsights.com https://buy.stripe.com https://js.stripe.com https://asgard-ai.pgallivan.workers.dev; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://www.gstatic.com https://api.stripe.com https://static.cloudflareinsights.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://buy.stripe.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(self "https://buy.stripe.com" "https://js.stripe.com")',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Reject probes and protocol oddities
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { ...STRICT_HEADERS, 'Allow': 'GET, HEAD' } });
    }
    // Strip bot probe paths
    if (/^\/(\.env|\.git|wp-login\.php|wp-admin|xmlrpc\.php|phpmyadmin)/i.test(url.pathname)) {
      return new Response('Not found', { status: 404, headers: STRICT_HEADERS });
    }
    // Fetch origin
    const originUrl = ORIGIN + url.pathname + url.search;
    let response;
    try {
      response = await fetch(originUrl, {
        method: request.method,
        headers: { 'User-Agent': request.headers.get('User-Agent') || 'sportportal-headers-worker' },
        cf: { cacheTtl: 300, cacheEverything: true },
      });
    } catch (e) {
      return new Response('Upstream unavailable', { status: 502, headers: STRICT_HEADERS });
    }
    // Clone with strict headers overlaid
    const newHeaders = new Headers(response.headers);
    // Remove any conflicting/old policy headers
    newHeaders.delete('Content-Security-Policy');
    newHeaders.delete('Content-Security-Policy-Report-Only');
    newHeaders.delete('Strict-Transport-Security');
    newHeaders.delete('X-Frame-Options');
    newHeaders.delete('X-Content-Type-Options');
    newHeaders.delete('Referrer-Policy');
    newHeaders.delete('Permissions-Policy');
    newHeaders.delete('Cross-Origin-Opener-Policy');
    newHeaders.delete('Cross-Origin-Resource-Policy');
    // Apply strict policy headers
    for (const [k, v] of Object.entries(STRICT_HEADERS)) newHeaders.set(k, v);
    // Preserve content-type, cache-control, etag, etc.
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
  },
};
