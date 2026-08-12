import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Flat config for `packages/*`. The Nuxt app in `apps/web` generates its own
 * config through `@nuxt/eslint` because it needs `.vue` parsing and the Nuxt
 * auto-import globals, so it is ignored here.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      'apps/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // The CLI *is* a terminal UI: writing to stdout is its whole job.
    files: ['packages/cli/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
)
