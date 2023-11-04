import type { Control, Preset } from '@webdmx/common';
import { DMX, PRESET_NAMES, type PresetName } from '@webdmx/controller';

export class Presets {
  // internal cache for loaded presets
  #loaded = PRESET_NAMES.reduce((acc, name) => ({ ...acc, [name]: null }), {}) as Record<PresetName, Preset | null>;

  /**
   * The presets that are currently loaded.
   * Will be initialized with `null` for each known preset name.
   */
  get loaded() {
    return this.#loaded;
  }

  /**
   * Generic getter for a preset with the given name.
   */
  get(name: string | PresetName | undefined): Preset | undefined {
    return this.#loaded[name as PresetName] ?? undefined;
  }

  /**
   * The profile names of the preset with the given name.
   */
  getProfileNames(name?: string | PresetName): ReadonlyArray<keyof Preset['profiles']> {
    return Object.keys(this.#loaded[name as PresetName]?.profiles ?? {});
  }

  /**
   * Delivers the channels of the preset with the given name and profile.
   */
  getChannels(name?: string | PresetName, profile?: string): Preset['profiles'][string]['channels'] {
    return this.#loaded[name as PresetName]?.profiles?.[profile!]?.channels ?? [];
  }

  /**
   * Returns the controls of the preset with the given name.
   */
  getControls(name?: string | PresetName): Preset['controls'] {
    return this.#loaded[name as PresetName]?.controls ?? {};
  }

  /**
   * Returns a specific control of the preset with the given name.
   */
  getControl<R extends Control>(name?: string | PresetName, channel?: string): R | undefined {
    return this.#loaded[name as PresetName]?.controls?.[channel!] as R | undefined;
  }

  /**
   * Loads the preset with the given name and stores it in the cache.
   */
  async load(...names: (string | PresetName | undefined)[]): Promise<Array<Preset | undefined>> {
    return Promise.all(
      names
        // remove duplicates and undefined values
        .filter((name, index) => name !== undefined && names.indexOf(name) === index)
        // check whether preset is already loaded
        .filter((name) => !this.#loaded[name as PresetName])
        // load preset and add it to the list
        .map(async (name) => {
          const preset = await DMX.loadPreset(name as PresetName);
          this.#loaded = { ...this.#loaded, [name as PresetName]: preset ?? null };
          return preset;
        }),
    );
  }
}

export const presets = new Presets();
