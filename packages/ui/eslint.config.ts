import config from '@enke.dev/lint';
import type { Linter } from 'eslint';

export default [
  ...config,
  // ignore generated stuff
  { ignores: ['src/components/layout/legacy'] },
  // configure root dir in monorepo
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
] satisfies Linter.Config[];
