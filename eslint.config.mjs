import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      'no-constant-condition': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  { ignores: ['dist/'] },
];
