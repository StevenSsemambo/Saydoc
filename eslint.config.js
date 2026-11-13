import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react },
    rules: {
      // JSX-aware: without these, <Icon /> is not counted as a use of Icon and a
      // missing <Component /> is never reported (this once caused a runtime crash).
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }],
      // New React-compiler-era rules flag long-standing patterns (setState in effects,
      // window globals). Kept visible as warnings; fix gradually rather than block lint.
      'react-refresh/only-export-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    // Netlify Function, tests and tooling run in Node (fetch/Response/process are built in)
    files: ['netlify/**/*.{js,mjs}', 'tests/**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
  },
])
