import type { Device } from './types/device.types.js';
import type { SerialDriver } from './drivers/serial.driver.js';

import generic from '../presets/generic.preset.json' assert { type: 'json' };
import genericRGB from '../presets/generic-rgb.preset.json' assert { type: 'json' };
import { Channels } from './types/universe.types.js';

const PREDEFINED_DEVICES = {
  generic,
  genericRGB,
} satisfies Record<string, Device>;

export interface DmxOptions {
  devices: Record<string, Device>;
}

export class DMX {
  readonly #devices = new Map<string, Device>();
  readonly #universes = new Map<string, SerialDriver>();

  constructor({ devices = {} }: Partial<DmxOptions> = {}) {
    this.#devices = new Map([
      // set predefined devices first (may be overwritten)
      ...Object.entries<Device>(PREDEFINED_DEVICES),
      // add the custom devices
      ...Object.entries(devices),
    ]);
  }

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
