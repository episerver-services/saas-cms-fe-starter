// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  // Ignore these files
  {
    ignores: ['lib/optimizely/sdk.ts', 'app/globals.css'],
  }, // Apply the base config
  ...compat.extends('next/core-web-vitals', 'next/typescript'), // Global rule overrides
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }, // ✅ Allow `require()` in PostCSS config files
  {
    files: ['postcss.config.{js,cjs,mjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }, // ✅ Disable linting rules for CSS files
  {
    files: ['**/*.css'],
    rules: {
      'no-unused-expressions': 'off',
      'no-undef': 'off',
      'import/no-unresolved': 'off',
    },
  },
  ...storybook.configs['flat/recommended'],
]

export default eslintConfig
