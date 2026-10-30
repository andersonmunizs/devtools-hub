import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.tools/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        HTMLSelectElement: 'readonly',
      },
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
];
