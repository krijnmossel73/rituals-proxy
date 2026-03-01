const TARGET_ORIGIN = "https://www.rituals.com";

const HTML_PAGE = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rituals</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe
    src="/nl-nl/home"
    allowfullscreen
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
  ></iframe>

  <!-- Botpress Webchat Widget -->
  <script src="https://cdn.botpress.cloud/webchat/v3.6/inject.js" defer></script>
  <script src="https://files.bpcontent.cloud/2026/03/01/16/20260301160530-P0BOBNVN.js" defer></script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve the wrapper page at the root
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(HTML_PAGE, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    // Everything else: proxy to rituals.com
    const targetUrl = TARGET_ORIGIN + url.pathname + url.search;

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: (() => {
        const headers = new Headers(request.headers);
        headers.set("Host", "www.rituals.com");
        headers.set("Referer", TARGET_ORIGIN);
        headers.set("Origin", TARGET_ORIGIN);
        headers.delete("cf-connecting-ip");
        headers.delete("cf-ipcountry");
        headers.delete("cf-ray");
        headers.delete("cf-visitor");
        headers.delete("x-forwarded-for");
        headers.delete("x-forwarded-proto");
        return headers;
      })(),
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow",
    });

    let response;
    try {
      response = await fetch(modifiedRequest);
    } catch (e) {
      return new Response("Proxy error: " + e.message, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");
    const isCss = contentType.includes("text/css");
    const isJs = contentType.includes("javascript");

    // Strip iframe-blocking and security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("x-frame-options");
    newHeaders.delete("content-security-policy");
    newHeaders.delete("content-security-policy-report-only");
    newHeaders.delete("strict-transport-security");
    newHeaders.set("access-control-allow-origin", "*");

    // Rewrite internal URLs in text responses so navigation stays in the proxy
    if (isHtml || isCss || isJs) {
      let body = await response.text();

      body = body
        .replaceAll("https://www.rituals.com", url.origin)
        .replaceAll("http://www.rituals.com", url.origin)
        .replaceAll("//www.rituals.com", "//" + url.host);

      if (isHtml) {
        body = body.replace(
          /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi,
          ""
        );
        body = body.replace(
          /<meta[^>]+http-equiv=["']X-Frame-Options["'][^>]*>/gi,
          ""
        );
      }

      newHeaders.set(
        "content-length",
        new TextEncoder().encode(body).length.toString()
      );

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // Binary content: just strip headers and pass through
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
