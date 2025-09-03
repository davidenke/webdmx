import { exec as _exec } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, parse, resolve } from 'node:path';
import { cwd, exit } from 'node:process';
import { parseArgs, promisify } from 'node:util';

import type { Preset } from '@webdmx/common';
import { Presets, SingleBar } from 'cli-progress';

import { convertPlistToPreset } from './convert-plist.js';

// prepare promise based exec
const exec = promisify(_exec);

/**
 * Converts a given file from binary to xml and then to json.
 */
async function convert(path: string): Promise<Preset> {
  // convert file from binary to xml
  await exec(`plutil -convert xml1 '${path}'`);
  const xml = await readFile(path, 'utf-8');
  await exec(`plutil -convert binary1 '${path}'`);
  // convert xml to preset json
  return convertPlistToPreset(xml);
}

// handles the tool
async function main() {
  // read cli arguments
  const { values } = parseArgs({
    options: {
      source: { type: 'string' },
      target: { type: 'string' },
    },
  });
  const { source, target } = values;

  // check all required arguments are provided
  if (!source || !target) {
    console.error('No source and / or target path provided');
    exit(1);
  }

  // prepare file list and progress bar
  const progress = new SingleBar({}, Presets.shades_classic);
  const files = await readdir(resolve(cwd(), source));
  const fixtures = files.filter((file) => extname(file) !== '');

  // init progress bar
  progress.start(fixtures.length, 0);

  // copy the files to a temp folder
  const temp = new URL('../.temp', import.meta.url).pathname;
  await exec(`rm -rf '${temp}'`);
  await exec(`mkdir -p '${temp}'`);
  await exec(`cp -r '${source}/' '${temp}'`);

  // handle all given files
  for (const [i, fixture] of fixtures.entries()) {
    const { name } = parse(fixture);
    const plist = await convert(resolve(temp, fixture));
    const content = JSON.stringify(plist, null, 2);

    await writeFile(resolve(cwd(), target, `${name}.json`), content);

    progress.update(i + 1);
  }

  // remove temp folder
  await exec(`rm -rf '${temp}'`);

  // done!
  progress.stop();
}

main();
