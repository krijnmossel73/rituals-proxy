# Rituals Proxy + Botpress Widget

A Cloudflare Worker that proxies [rituals.com](https://www.rituals.com/nl-nl/home), strips framing-restriction headers so the site can be embedded in an iframe, and overlays a Botpress chat widget.

## How it works

- **`/`** — Serves an HTML page containing a full-screen iframe and the Botpress widget
- **Everything else** — Proxied through to `www.rituals.com` with `X-Frame-Options` and `Content-Security-Policy` headers removed

## Deploy to Cloudflare (via GitHub)

1. Push this repo to GitHub
2. In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Workers & Pages → Create → Import from Git**
3. Connect your GitHub account and select this repository
4. Cloudflare will detect `wrangler.toml` automatically — no build settings needed
5. Click **Deploy**

Your worker will be live at `https://rituals-proxy.YOURSUBDOMAIN.workers.dev`

## Updating the Botpress widget

The widget scripts are embedded directly in `src/index.js` in the `HTML_PAGE` constant. Replace the two `<script>` tags there if you need to point to a different Botpress bot.
