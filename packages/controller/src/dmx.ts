import type { Channels, Preset } from '@webdmx/common';

// import the generated index file to retrieve a list of all presets,
// to be loaded once necessary in the UI
import _PRESETS from '../presets/presets.json' assert { type: 'json' };
import type { AbstractDriver } from './drivers/base/abstract.driver.js';

export type DriverName = (typeof DRIVER_NAMES)[number];
export type PresetName = keyof typeof _PRESETS;

export const DRIVER_NAMES = ['enttec-open-dmx-usb', 'null', 'ws'] as const;
export const PRESET_NAMES = Object.keys(_PRESETS) as readonly PresetName[];
export const PRESETS = Object.entries(_PRESETS);

export class DMX {
  static readonly #presets: Readonly<Record<PresetName, string>> = _PRESETS;
  readonly #universes = new Map<string, AbstractDriver>();

  /**
   * Returns a list of all available drivers by name.
   */
  static get driverNames() {
    return DRIVER_NAMES;
  }

  /**
   * Returns a list of all available presets by name.
   * @returns The list of preset names.
   */
  static get presetNames(): PresetName[] {
    return Object.keys(this.#presets) as PresetName[];
  }

  /**
   * Returns the label of a preset by its name.
   * @param name The name of the preset to retrieve.
   * @returns The label of the preset or undefined if not found.
   */
  static getPresetLabel(name: PresetName): string | undefined {
    return this.#presets[name];
  }

  /**
   * Loads a driver by its name.
   * @param name The name of the driver to load.
   * @returns The driver class or undefined if not found.
   */
  static async loadDriver(name: DriverName): Promise<(new () => AbstractDriver) | undefined> {
    if (!DRIVER_NAMES.includes(name)) return;
    const { default: driver } = await import(`./drivers/${name}.driver.ts`);
    return driver;
  }

  /**
   * Load a preset by its name.
   * @param name The name of the preset to load.
   * @returns The preset object or undefined if not found.
   */
  static async loadPreset(name: PresetName): Promise<Preset | undefined> {
    if (!this.presetNames.includes(name)) return;
    const { default: preset } = await import(`../presets/${name}.preset.json`);
    return preset;
  }

  /**
   * Add a universe to the DMX controller.
   * @param name The name of the universe to add.
   * @param driver The driver to use for the universe.
   */
  async addUniverse(name: string, driver: AbstractDriver): Promise<void> {
    await driver.connect();
    await driver.open();

    this.#universes.set(name, driver);
  }

  /**
   * Updates the given channels in the universe.
   * @param name The name of the universe to update.
   * @param channels The channels to update.
   */
  update(name: string, channels: Channels) {
    this.#universes.get(name)?.update(channels);
  }

  /**
   * Sets given values from a specific channel in the universe.
   * This is helpful when setting a whole devices values at once.
   * @param name The name of the universe to update.
   * @param from The starting channel to update.
   * @param values The new values to set.
   */
  updateFrom(name: string, from: number, values: ArrayLike<number>): void {
    this.#universes.get(name)?.updateFrom(from, values);
  }

  /**
   * Update the whole available universe with the given value.
   * This will most likely be used to blank the whole universe with zeroes.
   * @param name The name of the universe to update.
   * @param value The new value to set.
   */
  updateAll(name: string, value: number): void {
    this.#universes.get(name)?.updateAll(value);
  }

  /**
   * Returns the channels of a universe by its name.
   * @param name The name of the universe to retrieve.
   * @returns The channels of the universe or undefined if not found.
   */
  getUniverse(name: string): Channels | undefined {
    return this.#universes.get(name)?.channels;
  }

  /**
   * Closes all universes.
   */
  async close(): Promise<void> {
    await Promise.all([...this.#universes.values()].map((universe) => universe.close()));
  }
}
