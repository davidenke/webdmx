import { SerialDriver } from './serial.driver.js';

export default class NullDriver extends SerialDriver {
  override readonly filers = [];
  override readonly options = {
    baudRate: 0,
    dataBits: 0,
    stopBits: 0,
    parity: 'none',
    sendInterval: 1000, // log the universe once every second
  } satisfies SerialDriver['options'];

  override async connect() {
    // no-op
  }

  override async send(_: SerialPort, universe: Uint8Array) {
    console.clear();
    console.log('[webdmx][NullDriver]', universe);
  }
}
