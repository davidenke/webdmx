import { SerialDriver } from './base/serial.driver.js';

export default class NullDriver extends SerialDriver {
  constructor() {
    super({
      baudRate: 0,
      dataBits: 0,
      stopBits: 0,
      parity: 'none',
      sendInterval: 1000, // log the universe once every second
    });
  }

  override async connect() {
    console.clear();
  }

  override async disconnect() {
    console.clear();
  }

  override async send(_: SerialPort, universe: Uint8Array) {
    console.clear();
    console.log('[webdmx][NullDriver]', universe);
  }
}
