import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // https://github.com/qmhc/vite-plugin-dts#options
    dts({
      entryRoot: 'src',
      include: 'src/**/*.ts',
      copyDtsFiles: true,
      strictOutput: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
      name: '@webdmx/controller',
    },
    minify: false,
  },
});
