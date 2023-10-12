#!/usr/bin/env ts-node

/// <reference types="node" />

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { parse, resolve } from 'node:path';
import { cwd } from 'node:process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    target: { type: 'string' },
  },
});
const { source, target } = values;

if (!source || !target) {
  console.error('Usage: build-preset-index --source <source> --target <target>');
  process.exit(1);
}

const from = resolve(cwd(), source!);
const files = await readdir(from);
const presets = files.filter((file) => file.endsWith('.preset.json'));

const index: Record<string, string> = {};
for await (const preset of presets) {
  const data = await readFile(resolve(from, preset), { encoding: 'utf-8' });
  const { name } = JSON.parse(data) as { name: string };
  index[name] = parse(preset).name;
}
await writeFile(resolve(cwd(), target!), JSON.stringify(index, null, 2));
