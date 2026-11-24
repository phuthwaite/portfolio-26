import { defineConfig, type Plugin } from 'vite'
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback(), oldPageRedirects()],
})
