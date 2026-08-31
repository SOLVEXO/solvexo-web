import { defineConfig } from 'vitest/config'
import path from 'path'

// Deliberately separate from vite.config.ts (not merged into it) so adding
// tests never touches the app's real build/dev config — this file only
// exists to give `vitest` the same `@` path alias the app already uses.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // jsdom (not 'node') so component/accessibility tests can actually
    // render into a DOM — a superset of what the pure-logic tests need too,
    // so this is a safe default for the whole suite rather than per-file
    // environment overrides.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
