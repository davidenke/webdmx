import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const __dirname = dirname(fileURLToPath(import.meta.url));
globalThis.__dirname = __dirname;
global.__dirname = __dirname;

// https://vitejs.dev/config/

// Library build
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './node_modules'),
    },
  },
  plugins: [nodePolyfills()],
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

// Application build
// export default defineConfig({});
