import { SerialDriver } from './serial.driver.js';

export default class EnttecOpenUSBDMXDriver extends SerialDriver {
  override readonly filers = [];
  override readonly options = {
    baudRate: 250000,
    dataBits: 8,
    stopBits: 2,
    parity: 'none',
    sendInterval: 46,
  } satisfies SerialDriver['options'];

  override async send(serialPort: SerialPort, universe: Uint8Array) {
    await serialPort.setSignals({ break: true, requestToSend: false });
    await serialPort.setSignals({ break: false, requestToSend: false });

    const writer = serialPort.writable?.getWriter();
    await writer?.write(Uint8Array.from([0x00, ...universe]));
    await writer?.close();
  }
}
