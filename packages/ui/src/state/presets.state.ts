import type { Preset } from '@webdmx/common';
import { DMX, PRESET_NAMES, type PresetName } from '@webdmx/controller';
import { state } from 'lit-shared-state';

import { persistLocalStorage } from '../utils/storage.utils.js';

export type Presets = Record<PresetName, Preset | null>;

@state(persistLocalStorage())
class PresetsState {
  /**
   * The presets that are currently loaded.
   * Will be initialized with `null` for each known preset name.
   */
  loaded: Presets = PRESET_NAMES.reduce((acc, name) => ({ ...acc, [name]: null }), {} as Presets);

  /**
   * Loads the preset with the given name.
   */
  async loadPreset(...names: (string | PresetName | undefined)[]): Promise<Array<Preset | undefined>> {
    return Promise.all(
      names
        // remove duplicates and undefined values
        .filter((name, index) => name !== undefined && names.indexOf(name) === index)
        // check whether preset is already loaded
        .filter((name) => !this.loaded[name as PresetName])
        // load preset and add it to the list
        .map(async (name) => {
          const preset = await DMX.loadPreset(name as PresetName);
          this.loaded = { ...this.loaded, [name as PresetName]: preset ?? null };
          return preset;
        }),
    );
  }
}

export const presets = new PresetsState() as PresetsState & Presets;
