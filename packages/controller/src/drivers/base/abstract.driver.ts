import type { Channels, Universe } from '@webdmx/common';

export const CHANNELS = 512;

export abstract class AbstractDriver<DriverOptions = unknown> extends EventTarget {
  protected abstract universe: Universe;
  abstract readonly options: DriverOptions;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  abstract open(): Promise<void>;
  abstract close(): Promise<void>;

  get(channel: number): number | undefined {
    if (channel < 1 || channel > CHANNELS) return;
    return this.universe[channel];
  }

  get channels(): Channels {
    return Object.fromEntries(this.universe.slice(0, CHANNELS).entries());
  }

  update(channels: Channels): void {
    for (const channel in channels) {
      const value = channels[channel];
      this.universe[channel] = value;
    }
  }

  updateFrom(from: number, values: ArrayLike<number>): void {
    this.universe.set(values, from);
  }

  updateAll(value: number): void {
    this.universe = this.universe.fill(value, 0, CHANNELS);
  }
}
