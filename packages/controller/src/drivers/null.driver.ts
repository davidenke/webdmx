import type { Channels, Driver } from '../types/driver.types.js';

export interface NullDriverOptions {
  webdmxSpeed: number;
}

export class NullDriver implements Driver {
  readonly #channels = new Uint8Array(513);
  readonly #options: NullDriverOptions;
  readonly #sendInterval: number;

  #interval?: number;

  get channels() {
    return this.#channels;
  }
  
  get sendInterval() {
    return this.#sendInterval;
  }

  constructor(options: Partial<NullDriverOptions> = {}) {
    this.#options = { webdmxSpeed: 1, ...options };
    this.#sendInterval = 1000 / (this.#options.webdmxSpeed || 1);
  }

  #logChannels() {
    console.log('[webdmx] NullDriver:', this.#channels.values());
  }

  async init() {
    this.start();
  }

  start() {
    this.#interval = window.setInterval(() => {
      this.#logChannels();
    }, this.#sendInterval);
  }

  stop() {
    window.clearInterval(this.#interval);
  }

  get(channel: number) {
    return this.#channels[channel];
  }

  update(channels: Channels) {
    for (const channel in channels) {
      this.#channels[Number(channel)] = channels[channel];
    }
  }

  updateAll(value: number) {
    this.#channels.fill(value);
  }

  async close() {
    // no op
  }
}
