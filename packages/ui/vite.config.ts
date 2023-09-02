import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // https://github.com/vitejs/vite/discussions/5081
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './node_modules'),
    },
  },
  server: {
    https: {
      cert: '.ssl/local.cert',
      key: '.ssl/local.key',
    },
  },
});
