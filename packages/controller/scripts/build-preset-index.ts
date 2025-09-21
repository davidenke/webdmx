#!/usr/bin/env ts-node

/// <reference types="node" />

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { cwd } from 'node:process';
import { parseArgs } from 'node:util';

import type { Preset } from '@webdmx/common';

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

const from = resolve(cwd(), source);
const files = await readdir(from);
const presets = files.filter((file) => file.endsWith('.preset.json'));

const index: Record<string, string> = {};
for await (const preset of presets) {
  const data = await readFile(resolve(from, preset), { encoding: 'utf-8' });
  const name = basename(preset, '.preset.json');
  const { label } = JSON.parse(data) satisfies Preset;
  index[name] = label;
}

const contents = `${JSON.stringify(index, null, 2)}\n`;
await writeFile(resolve(cwd(), target), contents);
