/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      vue: 'vue/dist/vue.esm-bundler',
      'vue$': 'vue/dist/vue.esm-bundler',
    },
  },
 test: {
  globals: true,
  environment: 'jsdom',
  coverage: {
    provider: 'v8',
    all: true, // include files not touched by tests
    include: ['src/**/*.{ts,tsx,js,jsx,vue}'],
    exclude: [
      '**/*.d.ts',
      'src/**/__mocks__/**',
      'src/**/tests/**',
      'src/**/stories/**'
    ],
    reporter: ['text', 'html'],
  },
},
});
