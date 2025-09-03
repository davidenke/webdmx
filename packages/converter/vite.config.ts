import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // add type check directly to vite
    checker({ typescript: true, overlay: false }),
  ],
  build: {
    // this is a node lib, setting ssr helps us here
    // https://github.com/vitejs/vite/issues/13926#issuecomment-1708536097
    ssr: true,
    lib: {
      entry: 'src/bin.ts',
      formats: ['es'],
      fileName: 'bin',
    },
    minify: false,
  },
});
