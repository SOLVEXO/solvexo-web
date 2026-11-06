import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { Plugin } from 'vite'
import fs from 'fs'
import { buildRobotsTxt, buildSitemapXml } from './src/seo/publicPages'
import { prerenderAll } from './src/seo/prerender'

/** Writes robots.txt and sitemap.xml for Solvexo's public site into the build (Vercel serves them before the SPA fallback). */
function seoFiles(): Plugin {
  return {
    name: 'solvexo-seo-files',
    apply: 'build',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemapXml(today) })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobotsTxt() })
    },
    // After index.html is written: one copy per public page with its own head tags and plain-HTML content
    // (served by middleware.ts), so search engines get page-specific HTML without running JavaScript.
    writeBundle(options) {
      const dir = options.dir ?? path.resolve(__dirname, 'dist')
      const template = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
      for (const [file, html] of prerenderAll(template)) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
        fs.writeFileSync(path.join(dir, file), html)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoFiles()],
  server: {
    port: 3000,
    // Store subdomains (`hello.localhost:3000`) are a real, separate host
    // Vite would otherwise reject outright ("This host is not allowed") —
    // see the storefront subdomain router in `src/router/index.tsx`.
    allowedHosts: ['.localhost'],
  },
  build: {
    rollupOptions: {
      output: {
        // Heavy libraries get their own long-cached chunks so the app shell stays small and a deploy does not re-download them.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          const pkg = id.split('node_modules/').pop()?.split('/')[0] ?? '';
          const scoped = id.split('node_modules/').pop()?.split('/').slice(0, 2).join('/') ?? '';
          if (['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'].includes(pkg)) return 'vendor-react';
          if (pkg === 'recharts' || pkg.startsWith('d3-') || pkg === 'victory-vendor') return 'vendor-charts';
          if (['socket.io-client', 'engine.io-client', 'socket.io-parser'].includes(pkg)) return 'vendor-socket';
          if (scoped.startsWith('@stripe/')) return 'vendor-stripe';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
