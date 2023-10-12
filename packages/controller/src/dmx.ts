// import the generated index file to retrieve a list of all presets,
// to be loaded once necessary in the UI
import PRESETS from '../presets/presets.json' assert { type: 'json' };
import type { SerialDriver } from './drivers/serial.driver.js';
import type { Preset } from './types/preset.types.js';
import type { Channels } from './types/universe.types.js';

export class DMX {
  readonly #presets = PRESETS;
  readonly #universes = new Map<string, SerialDriver>();

  /**
   * Returns a list of all available presets by name.
   */
  get presetNames() {
    return Object.keys(this.#presets) as Array<keyof typeof PRESETS>;
  }

  /**
   * Load a preset by its name.
   */
  async loadPreset(name: keyof typeof PRESETS): Promise<Preset | undefined> {
    if (!(name in this.#presets)) return;
    const path = this.#presets[name];
    const { default: preset } = await import(`../presets/${path}.json`);
    return preset;
  }

  /**
   * Add a universe to the DMX controller.
   */
  async addUniverse(name: string, driver: SerialDriver): Promise<void> {
    await driver.connect();
    await driver.open();

    this.#universes.set(name, driver);
  }

  /**
   * Updates the given channels in the universe.
   */
  update(name: string, channels: Channels) {
    this.#universes.get(name)?.update(channels);
  }

  /**
   * Sets given values from a specific channel in the universe.
   * This is helpful when setting a whole devices values at once.
   */
  updateFrom(name: string, from: number, values: ArrayLike<number>) {
    this.#universes.get(name)?.updateFrom(from, values);
  }

  /**
   * Update the whole available universe with the given value.
   * This will most likely be used to blank the whole universe with zeroes.
   */
  updateAll(name: string, value: number): void {
    this.#universes.get(name)?.updateAll(value);
  }

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
