export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Route to the working deployment that has our auto-winner code
    const targetUrl = "https://2233d7af.schoolsportportal.pages.dev" + url.pathname + url.search;
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow"
    });
    const response = await fetch(proxyRequest);
    // Clone with proper headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Served-By", "ssp-proxy");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}