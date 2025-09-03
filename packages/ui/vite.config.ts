import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import mkcert from 'vite-plugin-mkcert';

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
  plugins: [
    // add type check directly to vite
    checker({ typescript: true, overlay: false }),
    // ssl für lokalen dev server (cors int api)
    mkcert(),
  ],
});
