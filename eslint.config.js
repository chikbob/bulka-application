import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tsParser, extraFileExtensions: ['.vue'], sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { 'no-undef': 'off', '@typescript-eslint/no-explicit-any': 'error' },
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser, parserOptions: { sourceType: 'module' } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { 'no-undef': 'off', '@typescript-eslint/no-explicit-any': 'error' },
  },
]
