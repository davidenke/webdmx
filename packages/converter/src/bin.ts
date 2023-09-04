import { exec as _exec } from 'node:child_process';
import { extname, parse, resolve } from 'node:path';
import { cwd, exit } from 'node:process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { parseArgs, promisify } from 'node:util';

import { Presets, SingleBar } from 'cli-progress';
import plist from 'plist';
import { xml2json } from 'xml-js';

// prepare promise based exec
const exec = promisify(_exec);

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

/**
 * Converts a given file from binary to xml and then to json.
 */
async function convert(path: string): Promise<{ plist: string; raw: string }> {
  // convert file from binary to xml
  await exec(`plutil -convert xml1 '${path}'`);
  const xml = await readFile(path, 'utf-8');
  await exec(`plutil -convert binary1 '${path}'`);
  // convert xml to json
  const plistJson = plist.parse(xml);
  const rawJson = xml2json(xml, { compact: true, spaces: 2 });
  // return result
  return { plist: JSON.stringify(plistJson, null, 2), raw: rawJson };
}

// handles the tool
async function main() {
  // prepare file list and progress bar
  const progress = new SingleBar({}, Presets.shades_classic);
  const files = await readdir(resolve(cwd(), source!));
  const fixtures = files.filter((file) => extname(file) !== '');

  // init progress bar
  progress.start(fixtures.length, 0);

  // copy the files to a temp folder
  const temp = new URL('../.temp', import.meta.url).pathname;
  await exec(`rm -rf '${temp}'`);
  await exec(`mkdir -p '${temp}'`);
  await exec(`cp -r '${source!}/' '${temp}'`);

  // handle all given files
  for (const [i, fixture] of fixtures.entries()) {
    const { name } = parse(fixture);
    const { plist, raw } = await convert(resolve(temp, fixture));

    await writeFile(resolve(cwd(), target!, `${name}.plist.json`), plist);
    await writeFile(resolve(cwd(), target!, `${name}.raw.json`), raw);

    progress.update(i + 1);
  }

  // remove temp folder
  await exec(`rm -rf '${temp}'`);

  // done!
  progress.stop();
}

main();
