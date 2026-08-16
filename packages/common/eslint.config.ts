import { nodeLibrary } from '@enke.dev/lint/eslint/presets/node-library';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([globalIgnores(['dist', 'coverage']), ...nodeLibrary]);
