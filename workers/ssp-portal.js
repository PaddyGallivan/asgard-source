export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Proxy to working CF Pages deployment with our auto-winner code
    const targetUrl = "https://2233d7af.schoolsportportal.pages.dev" + url.pathname + url.search;
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow"
    });
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("x-frame-options");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}