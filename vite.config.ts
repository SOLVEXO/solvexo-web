import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
