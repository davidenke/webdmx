import type { Channels, Universe } from '../types/universe.types.js';

export type SerialDriverBaseOptions = SerialOptions & { sendInterval: number };

declare global {
  interface SerialDriverEventMap {
    staging: CustomEvent<boolean>;
  }
}

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
export abstract class SerialDriver<
  SerialDriverOptions extends SerialDriverBaseOptions = SerialDriverBaseOptions
> extends EventTarget {
  static readonly CHANNELS = 512;

  // add an extra bit, as we will prefix the universe with
  // an extra 0x00 byte to make all channels 1-based
  #universe: Universe = new Uint8Array(SerialDriver.CHANNELS + 1);

  #serialPort?: SerialPort;
  #interval?: number;

  // every time the universe is changed, we set this flag
  // until the changes have been submitted to the device
  #_staging = false;

  set #staging(staging: boolean) {
    this.#_staging = staging;
    this.dispatchEvent(new CustomEvent('staging', { detail: staging }));
  }
  get #staging(): boolean {
    return this.#_staging;
  }

  // must be implemented by driver implementations
  abstract readonly filers?: SerialPortFilter[];
  abstract readonly options: SerialDriverOptions;
  abstract send(serialPort: SerialPort, universe: Uint8Array): Promise<void>;

  // type the extended event listeners to use the correct event map
  override addEventListener<K extends keyof SerialDriverEventMap | string>(
    type: K,
    listener: K extends keyof SerialDriverEventMap
      ? (this: SerialDriver, ev: SerialDriverEventMap[K]) => any
      : EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    super.addEventListener(type, listener, options);
  }
  override removeEventListener<K extends keyof SerialDriverEventMap | string>(
    type: K,
    listener: K extends keyof SerialDriverEventMap
      ? (this: SerialDriver, ev: SerialDriverEventMap[K]) => any
      : EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    super.removeEventListener(type, listener, options);
  }

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
    this.#interval = window.setInterval(async () => {
      // call the drivers send method
      await this.send(this.#serialPort!, this.#universe);
      // reset the staging flag as all changes have been sent
      this.#staging = false;
    }, this.options.sendInterval);
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
    this.#staging = true;
    for (const channel in channels) {
      const value = channels[channel];
      this.#universe[channel] = value;
    }
  }

  updateFrom(from: number, values: ArrayLike<number>): void {
    this.#staging = true;
    this.#universe.set(values, from);
  }

  updateAll(value: number): void {
    this.#staging = true;
    this.#universe = this.#universe.fill(value, 0, SerialDriver.CHANNELS);
  }
}
