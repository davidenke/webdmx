import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import mkcert from 'vite-plugin-mkcert';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const iconsPath = 'node_modules/@shoelace-style/shoelace/dist/assets/icons';

// https://vitejs.dev/config/
export default defineConfig({
  // https://github.com/vitejs/vite/discussions/5081
  base: './',
  resolve: {
    alias: [
      {
        find: /\/assets\/icons\/(.+)/,
        replacement: `${iconsPath}/$1`,
      },
    ],
  },
  plugins: [
    // add type check directly to vite
    checker({ typescript: true, overlay: false }),
    // ssl für lokalen dev server (cors int api)
    mkcert(),
    // shoelace assets kopieren
    viteStaticCopy({
      targets: [
        {
          src: iconsPath,
          dest: 'assets',
        },
      ],
    }),
  ],
});
