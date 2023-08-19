import type { Device } from './types/device.types.js';
import type { Channels, Driver } from './types/driver.types.js';

import generic from '../presets/generic.preset.json' assert { type: 'json' };
import genericRGB from '../presets/generic-rgb.preset.json' assert { type: 'json' };

const PREDEFINED_DEVICES = {
  generic,
  genericRGB,
} satisfies Record<string, Device>;

export interface DmxOptions {
  devices: Record<string, Device>;
}

export class DMX {
  readonly #devices = new Map<string, Device>();
  readonly #universes = new Map<string, Driver>();

  constructor({ devices = {} }: Partial<DmxOptions> = {}) {
    this.#devices = new Map([
      // set predefined devices first (may be overwritten)
      ...Object.entries<Device>(PREDEFINED_DEVICES),
      // add the custom devices
      ...Object.entries(devices),
    ]);
  }

  async addUniverse(name: string, driver: Driver): Promise<Driver> {
    await driver.init();

    // driver.on(Events.update, (channels, extraData) => {
    //   this.emit(Events.update, name, channels, extraData);
    // });

    this.#universes.set(name, driver);

    return driver;
  }

  update(name: string, channels: Channels, extraData?: any) {
    this.#universes.get(name)?.update(channels, extraData || {});
  }

  updateAll(name: string, value: number): void {
    this.#universes.get(name)?.updateAll(value);
    // this.emit(Events.updateAll, universe, value);
  }

  universeToObject(name: string): { [key: number]: number } {
    if (!this.#universes.has(name)) return {};

    const { channels } = this.#universes.get(name)!;
    return Object.fromEntries(channels.entries());
  }

  async close(): Promise<void> {
    await Promise.allSettled([...this.#universes.values()].map((universe) => universe.close()));
    // this.removeAllListeners();
  }
}
