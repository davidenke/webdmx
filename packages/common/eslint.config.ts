import config from '@enke.dev/lint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...config,
  // configure root dir in monorepo
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
]);
