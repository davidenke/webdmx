import type { Universe } from '@webdmx/common';

import { AbstractDriver, CHANNELS } from './abstract.driver.js';

export type SerialDriverOptions = SerialOptions & { sendInterval: number };

declare global {
  interface SerialDriverEventMap {
    transferring: CustomEvent<boolean>;
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
export class SerialDriver<
  DriverOptions extends SerialDriverOptions = SerialDriverOptions,
> extends AbstractDriver<DriverOptions> {
  // add an extra bit, as we will prefix the universe with
  // an extra 0x00 byte to make all channels 1-based
  readonly universe: Universe = new Uint8Array(CHANNELS + 1);

  #serialPort?: SerialPort;
  #interval?: number;

  // every time the universe is changed, we set this flag
  // until the changes have been submitted to the device
  #_transferring = false;

  set #transferring(transferring: boolean) {
    this.#_transferring = transferring;
    this.dispatchEvent(new CustomEvent('transferring', { detail: transferring }));
  }
  get #transferring(): boolean {
    return this.#_transferring;
  }

  constructor(
    override options: DriverOptions,
    readonly filters: SerialPortFilter[] = [],
  ) {
    super();
  }

  protected async send(serialPort: SerialPort, universe: Uint8Array): Promise<void> {
    await serialPort.setSignals({ break: true, requestToSend: false });
    await serialPort.setSignals({ break: false, requestToSend: false });

    const writer = serialPort.writable?.getWriter();
    await writer?.write(Uint8Array.from([0x00, ...universe]));
    await writer?.close();
  }

  // type the extended event listeners to use the correct event map
  override addEventListener<K extends keyof SerialDriverEventMap | string>(
    type: K,
    listener: K extends keyof SerialDriverEventMap
      ? (this: SerialDriver, ev: SerialDriverEventMap[K]) => void
      : EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(type, listener as EventListener, options);
  }
  override removeEventListener<K extends keyof SerialDriverEventMap | string>(
    type: K,
    listener: K extends keyof SerialDriverEventMap
      ? (this: SerialDriver, ev: SerialDriverEventMap[K]) => void
      : EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.removeEventListener(type, listener as EventListener, options);
  }

  async connect(): Promise<void> {
    const filters = this.filters ?? [];
    this.#serialPort = await navigator.serial.requestPort({ filters });
  }

  async disconnect(): Promise<void> {
    await this.#serialPort?.forget();
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

  async start(): Promise<void> {
    this.send(this.#serialPort!, this.universe);
    this.#interval = window.setInterval(async () => {
      // call the drivers send method
      await this.send(this.#serialPort!, this.universe);
      // reset the transferring flag as all changes have been sent
      this.#transferring = false;
    }, this.options.sendInterval);
  }

  stop(): void {
    window.clearInterval(this.#interval);
  }
}
