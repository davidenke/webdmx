import type { Channels, Driver } from '../types/driver.types';

export type SerialDriverOptions = {
  webdmxSpeed: number;
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: 'none';
};

export abstract class SerialDriver implements Driver {
  readonly #channels = new Uint8Array(513);
  readonly #serialPort: SerialPort;
  readonly #options: SerialDriverOptions;
  readonly #sendInterval: number;

  #interval?: number;

  get channels() {
    return this.#channels;
  }

  get sendInterval() {
    return this.#sendInterval;
  }

  constructor(serialPort: SerialPort, options: Partial<SerialDriverOptions> = {}) {
    this.#serialPort = serialPort;
    this.#options = { webdmxSpeed: 33, baudRate: 38400, dataBits: 8, stopBits: 1, parity: 'none', ...options };
    this.#sendInterval = 1000 / (this.#options.webdmxSpeed || 33);
  }

  async init() {
    await this.#serialPort.open({
      baudRate: this.#options.baudRate,
      dataBits: this.#options.dataBits,
      stopBits: this.#options.stopBits,
      parity: this.#options.parity,
    });
    this.start();
  }

  start() {
    this.#interval = window.setInterval(() => {
      // todo implement me!
    }, this.#sendInterval);
  }

  stop() {
    window.clearInterval(this.#interval);
  }

  get(channel: number) {
    throw new Error('Method not implemented.');
    return 0;
  }

  update(channels: Channels, extraData?: any): void {
    throw new Error('Method not implemented.');
  }

  updateAll(value: number): void {
    throw new Error('Method not implemented.');
  }

  close(): void | Promise<void> {
    throw new Error('Method not implemented.');
  }
}
