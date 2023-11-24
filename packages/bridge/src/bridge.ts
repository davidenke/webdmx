import dgram from 'dgram';
import dotenv from 'dotenv';
import OSC from 'osc-js';
import WebSocket from 'ws';

console.log('Starting DMX to OSC bridge');

dotenv.config();

const dmx_universe = process.env.DMX_UNIVERSE || 'dmx/universe/0';
const host = process.env.OSC_HOST;
const port: number = parseInt(process.env.OSC_PORT || '7770');
const ws_port: number = parseInt(process.env.WS_PORT || '8080');

console.log(`OSC host: ${host}`);
console.log(`OSC port: ${port}`);
console.log(`WS port: ${ws_port}`);
console.log(`DMX universe: ${dmx_universe}`);

const udp_socket = dgram.createSocket('udp4');
const wss = new WebSocket.Server({ port: ws_port });

wss.on('connection', function connection(ws) {
  console.log('New connection');
  ws.on('message', function incoming(dmx_raw_data) {
    // console.log('Received DMX data');
    const buffer = Buffer.isBuffer(dmx_raw_data) ? dmx_raw_data : Buffer.concat(dmx_raw_data as Buffer[]);
    const dmx_data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    dmx_data.forEach((value, index) => {
      const oscBuffer = Buffer.from(new OSC.Message([dmx_universe, (index + 1).toString()], value).pack());
      udp_socket.send(oscBuffer, 0, oscBuffer.length, port, host);
    });
  });
});
