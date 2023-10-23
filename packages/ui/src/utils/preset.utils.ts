import type { Preset } from '@webdmx/common';
import { DMX } from '@webdmx/controller';

export async function loadPreset(
  presets: Record<string, Preset | null>,
  ...names: (string | undefined)[]
): Promise<Record<string, Preset | null>> {
  // load preset if missing
  const updatedPresets = names
    // check whether preset is already loaded and a name is given
    .filter((name) => name !== undefined && !presets[name])
    // load preset and add it to the list
    .reduce(
      async (presets, name) => ({
        ...(await presets),
        [name!]: (await DMX.loadPreset(name!)) ?? null,
      }),
      Promise.resolve(presets),
    );
  // return the updated presets
  return updatedPresets;
}
