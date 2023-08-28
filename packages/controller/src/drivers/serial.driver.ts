import type { Channels, Universe } from '../types/universe.types.js';

export type SerialDriverBaseOptions = SerialOptions & { sendInterval: number };

/**
 * Manages a serial port. The following lifecycle is expected:
 * 1. connect()
 * 2. open()
 * 3. start()
 * 4. update() or updateAll()
 * 5. stop()
 * 6. close()
 * 7. disconnect()
 */
export abstract class SerialDriver<SerialDriverOptions extends SerialDriverBaseOptions = SerialDriverBaseOptions> {
  static readonly CHANNELS = 512;

  // add an extra bit - for a reason not known to mankind; however,
  // expose only the first 512 bytes to be used as DMX channels
  #universe: Universe = new Uint8Array(SerialDriver.CHANNELS + 1);

  #serialPort?: SerialPort;
  #interval?: number;

  // must be implemented by driver implementations
  abstract readonly filers?: SerialPortFilter[];
  abstract readonly options: SerialDriverOptions;
  abstract send(serialPort: SerialPort, universe: Uint8Array): Promise<void>;

  async connect(): Promise<void> {
    const filters = this.filers ?? [];
    this.#serialPort = await navigator.serial.requestPort({ filters });
  }

  async open(): Promise<void> {
    const { baudRate, dataBits, stopBits, parity } = this.options;
    await this.#serialPort?.open({ baudRate, dataBits, stopBits, parity });
    this.start();
  }

  async close(): Promise<void> {
    this.stop();
    await this.#serialPort?.close();
  }

  async disconnect(): Promise<void> {
    await this.#serialPort?.forget();
  }

  start(): void {
    this.#interval = window.setInterval(
      async () => await this.send(this.#serialPort!, this.#universe),
      this.options.sendInterval
    );
  }

  stop(): void {
    window.clearInterval(this.#interval);
  }

  get(channel: number): number | undefined {
    if (channel < 1 || channel > SerialDriver.CHANNELS) return;
    return this.#universe[channel];
  }

  get channels(): Channels {
    return Object.fromEntries(this.#universe.slice(0, SerialDriver.CHANNELS).entries());
  }

  update(channels: Channels): void {
    for (const channel in channels) {
      const value = channels[channel];
      this.#universe[channel] = value;
    }
  }

  updateFrom(from: number, values: ArrayLike<number>): void {
    this.#universe.set(values, from);
  }

  updateAll(value: number): void {
    this.#universe = this.#universe.fill(value, 0, SerialDriver.CHANNELS);
  }
}
