const WIDGET_SCRIPT = '<script src="https://falkor-widget.luckdragon.io/widget.js" data-product="School Sport Portal"></script>';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = "https://2233d7af.schoolsportportal.pages.dev" + url.pathname + url.search;
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow"
    });
    const response = await fetch(proxyRequest);

    // Only inject into HTML responses
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    // Inject Falkor widget before </body>
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Served-By", "ssp-proxy");
    newHeaders.delete("content-encoding"); // HTMLRewriter needs uncompressed

    return new HTMLRewriter()
      .on('body', {
        element(el) {
          el.onEndTag(tag => {
            tag.before(WIDGET_SCRIPT, { html: true });
          });
        }
      })
      .transform(new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      }));
  }
}