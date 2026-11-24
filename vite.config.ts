import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages has no server-side routing: an address like /case-studies/samsung would 404. Emitting
// the app's page as 404.html too lets main.tsx read the path and show the right page.
const spaFallback = (): Plugin => ({
  name: 'spa-404-fallback',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const index = bundle['index.html']
    if (index?.type === 'asset') this.emitFile({ type: 'asset', fileName: '404.html', source: index.source })
  },
})

// Pages on the previous pixels.ph, which are still linked to (including from vw.pixels.ph, samsung.pixels.ph
// etc.): each becomes a small page that sends visitors on to the new one.
const oldPages: Record<string, string> = {
  'samsung/index.html': '/case-studies/samsung',
  'samsung/cs-sam.html': '/case-studies/samsung',
  'volkswagen/index.html': '/case-studies/vw',
  'volkswagen/cs-vw.html': '/case-studies/vw',
  'vw/index.html': '/case-studies/vw',
  'axs/index.html': '/case-studies/axs',
  'thewhitecompany/index.html': '/case-studies/twc',
  // until its case study is ready
  'holibob/index.html': '/',
}
const oldPageRedirects = (): Plugin => ({
  name: 'old-page-redirects',
  apply: 'build',
  generateBundle() {
    for (const [fileName, to] of Object.entries(oldPages)) {
      const source = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Pauline Huthwaite</title>
    <link rel="canonical" href="https://pixels.ph${to}" />
    <meta http-equiv="refresh" content="0; url=${to}" />
    <script>location.replace(${JSON.stringify(to)})</script>
  </head>
  <body><a href="${to}">This page has moved</a></body>
</html>
`
      this.emitFile({ type: 'asset', fileName, source })
    }
  },
})

// Staging (preview.pixels.ph) is any Cloudflare Pages build of a branch other than main: it's kept out of
// search results and labelled, so it can't be mistaken for the live site. Cloudflare sets CF_PAGES_BRANCH;
// the live GitHub Pages build and local builds don't have it.
const staging = (): Plugin => ({
  name: 'staging',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' },
    {
      tag: 'div',
      attrs: {
        style:
          'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:100;pointer-events:none;padding:4px 12px 5px;border-radius:0 0 8px 8px;background:#ffd166;color:#0d0f22;font:600 11px/1.2 Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase',
      },
      children: 'Staging',
      injectTo: 'body',
    },
  ],
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const branch = loadEnv(mode, '.', 'CF_PAGES').CF_PAGES_BRANCH
  const isStaging = !!branch && branch !== 'main'
  return {
    plugins: [react(), tailwindcss(), isStaging && staging(), spaFallback(), oldPageRedirects()],
  }
})
