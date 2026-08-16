import { frontend } from '@enke.dev/lint/eslint/presets/frontend';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // ignore generated stuff
  globalIgnores(['dist', 'reports', '.ssl', 'src/components/layout/legacy']),
  ...frontend,
]);
