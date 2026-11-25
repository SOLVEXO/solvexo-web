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
  globalIgnores(['dist', 'dist-ssr']),
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
  {
    // One dropdown for the whole dashboard, admin and sign-in pages: use <Select> from '@/components/comman/ui'
    // (search, icons, keyboard, phone sheet). Storefront themes own their look and keep native controls.
    files: ['src/**/*.tsx'],
    ignores: [
      'src/components/comman/ui/Dropdown.tsx',
      'src/components/comman/ui/DateField.tsx',
      'src/components/comman/ui/ColorField.tsx',
      'src/features/storefront/**',
      'src/features/storefront-themes/**',
      'src/features/themes-assets/**',
      '**/*.test.tsx',
    ],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "JSXOpeningElement[name.name='select']",
        message: "Do not use a raw <select>. Use <Select> from '@/components/comman/ui' (same <option> children and onChange(e)); it has search, icons, keyboard and a phone sheet.",
      }, {
        selector: "JSXOpeningElement[name.name=/^(input|Input)$/]:has(JSXAttribute[name.name='type'][value.value=/^(date|datetime-local|time|month)$/])",
        message: "Do not use a raw date / time input. Use <DateField>, <DateTimeField>, <TimeField>, <MonthField> or <DateRangePicker> from '@/components/comman/ui' (same value and onChange(e) shape).",
      }, {
        selector: "JSXOpeningElement[name.name='input']:has(JSXAttribute[name.name='type'][value.value='color'])",
        message: "Do not use a raw colour input. Use <ColorField> from '@/components/comman/ui' (hex box, shade area, brand colours, recent colours).",
      }],
    },
  },
])
