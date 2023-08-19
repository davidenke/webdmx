import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './node_modules'),
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    minify: false,
    rollupOptions: {
      external: /^lit/,
    },
  },
  server: {
    https: {
      cert: '.ssl/local.cert',
      key: '.ssl/local.key',
    },
  },
});
