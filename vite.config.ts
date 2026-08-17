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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
