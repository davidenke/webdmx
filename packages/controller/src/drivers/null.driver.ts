import { SerialDriver } from './base/serial.driver.js';

export default class NullDriver extends SerialDriver {
  constructor() {
    super({
      baudRate: 0,
      parity: 'none',
      sendInterval: 1000, // log the universe once every second
    });
  }

  override async connect() {
    // eslint-disable-next-line no-console
    console.clear();
  }

  override async disconnect() {
    // eslint-disable-next-line no-console
    console.clear();
  }

  override async send(_: SerialPort, universe: Uint8Array) {
    // eslint-disable-next-line no-console
    console.clear();
    // eslint-disable-next-line no-console
    console.log('[webdmx][NullDriver]', universe);
  }
}
