import { nodeLibrary } from '@enke.dev/lint/eslint/presets/node-library';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  // ignore generated stuff
  globalIgnores([
    'dist',
    'coverage',
    'fixtures',
    'presets/preset.schema.json',
    'presets/presets.json',
  ]),
  ...nodeLibrary,
]);
