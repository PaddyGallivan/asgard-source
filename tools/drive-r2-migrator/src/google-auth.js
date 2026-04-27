// Service-account JWT → Google access token. Pure Web Crypto, no node deps.
// Caches token in memory per Worker isolate (token lifetime ~1hr).

let cachedToken = null;
let cachedExp = 0;

function b64url(bytes) {
  let str;
  if (bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes);
  if (bytes instanceof Uint8Array) {
    str = '';
    for (const b of bytes) str += String.fromCharCode(b);
    str = btoa(str);
  } else {
    // string input
    str = btoa(bytes);
  }
  return str.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToArrayBuffer(pem) {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(stripped);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

export async function getAccessToken(saJsonString) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedExp > now + 60) return cachedToken;

  const sa = JSON.parse(saJsonString);
  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const claimB64 = b64url(new TextEncoder().encode(JSON.stringify(claim)));
  const signingInput = `${headerB64}.${claimB64}`;

  const keyBuf = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const sigB64 = b64url(sigBuf);
  const jwt = `${signingInput}.${sigB64}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!tokenResp.ok) {
    throw new Error(`Token exchange failed: ${tokenResp.status} ${await tokenResp.text()}`);
  }
  const data = await tokenResp.json();
  cachedToken = data.access_token;
  cachedExp = now + (data.expires_in || 3600);
  return cachedToken;
}
