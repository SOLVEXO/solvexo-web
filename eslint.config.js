import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// eslint-plugin-jsx-a11y's package.json still only *advertises* ESLint
// ^3-9 support (npm view eslint-plugin-jsx-a11y peerDependencies) — no
// published version has bumped that range for ESLint 10 yet. Verified here
// that the plugin's actual rule implementations and its `flatConfigs`
// export work correctly against this project's real ESLint 10 flat config
// (installed with --legacy-peer-deps to bypass the conservative metadata
// gate, not because the code itself is broken) — the peer-range warning is
// npm being cautious about an untested major bump, not a real runtime
// incompatibility. Re-verify this comment's claim if a future
// eslint-plugin-jsx-a11y major version changes its rule-visitor internals.
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
