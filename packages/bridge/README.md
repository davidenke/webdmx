# OSC Websocket Bridge

This package provides a bridge between OSC and Websockets. It is used to send OSC messages from from a client (e.g. Browsr) to the server and vice versa.

## Usage

```bash
pnpm -r --filter @webdmx/osc-ws-bridge dev
```

## Implementation

The bridge is implemented as a Node.js server. It listens for incoming Websocket messages and forwards them to the OSC server.

It's currently not possible to send OSC messages from the server to the client. This will be implemented in the future.
