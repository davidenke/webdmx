import type { Control, Preset } from '@webdmx/common';
import type { PresetName } from '@webdmx/controller';
import { DMX, PRESET_NAMES } from '@webdmx/controller';

export class Presets {
  // internal cache for loaded presets
  #loaded = PRESET_NAMES.reduce((acc, name) => ({ ...acc, [name]: null }), {}) as Record<
    PresetName,
    Preset | null
  >;

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
  get(presetName: string | PresetName | undefined): Preset | undefined {
    return this.#loaded[presetName as PresetName] ?? undefined;
  }

  /**
   * The profile names of the preset with the given name.
   */
  getProfileNames(presetName?: string | PresetName): readonly (keyof Preset['profiles'])[] {
    return Object.keys(this.#loaded[presetName as PresetName]?.profiles ?? {});
  }

  /**
   * Delivers the channels of the preset with the given name and profile.
   */
  getChannels(
    presetName: string | PresetName,
    profileName: string
  ): Preset['profiles'][string]['channels'] {
    return this.#loaded[presetName as PresetName]?.profiles?.[profileName]?.channels ?? [];
  }

  /**
   * Returns the controls of the preset with the given name.
   */
  getControls(presetName?: string | PresetName): Preset['controls'] {
    return this.#loaded[presetName as PresetName]?.controls ?? {};
  }

  /**
   * Returns a specific control of the preset with the given name.
   */
  getControl<R extends Control>(
    presetName: string | PresetName,
    channelName: string
  ): R | undefined {
    return this.#loaded[presetName as PresetName]?.controls?.[channelName] as R | undefined;
  }

  /**
   * Loads the preset with the given name and stores it in the cache.
   */
  async load(...presetNames: (string | PresetName | undefined)[]): Promise<(Preset | undefined)[]> {
    return Promise.all(
      presetNames
        // remove duplicates and undefined values
        .filter((name, index) => name !== undefined && presetNames.indexOf(name) === index)
        // check whether preset is already loaded
        .filter(name => !this.#loaded[name as PresetName])
        // load preset and add it to the list
        .map(async name => {
          const preset = await DMX.loadPreset(name as PresetName);
          this.#loaded = { ...this.#loaded, [name as PresetName]: preset ?? null };
          return preset;
        })
    );
  }
}

export const presets = new Presets();
