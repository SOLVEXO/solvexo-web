import { configDefaults, defineConfig } from 'vitest/config'
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
    // src/features/themes-assets holds vendored third-party storefront templates (theme-3 is a separate Next.js +
    // Saleor project with its own package.json and vitest.config.ts). The app never imports them and tsconfig.app.json
    // already excludes the folder; their tests need that project's own dependencies and GraphQL codegen, and run with
    // its own config (`npx vitest run` inside the template), not under the app's `@` alias and jsdom.
    exclude: [...configDefaults.exclude, 'src/features/themes-assets/**'],
  },
})
