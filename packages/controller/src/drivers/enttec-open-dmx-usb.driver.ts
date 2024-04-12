import { SerialDriver } from './base/serial.driver.js';

export default class EnttecOpenUSBDMXDriver extends SerialDriver {
  constructor() {
    super({
      baudRate: 250000,
      dataBits: 8,
      stopBits: 2,
      parity: 'none',
      sendInterval: 46,
    });
  }
}
