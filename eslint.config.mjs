import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'scripts/**/*.{js,mjs,ts,tsx}'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  }];
