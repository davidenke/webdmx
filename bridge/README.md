# DMX to OSC Bridge

## Overview

This Rust application serves as a bridge, converting DMX data into OSC (Open Sound Control) messages. It listens for DMX data over a WebSocket connection and forwards it as OSC messages to a specified host and port.

## Configuration

Set the following environment variables:

- `DMX_UNIVERSE`: (Optional) Specifies the DMX universe. Defaults to "dmx/universe/0".
- `OSC_HOST`: Host address for OSC messages.
- `OSC_PORT`: Port for OSC messages. Defaults to 7770.
- `WS_PORT`: WebSocket server port. Defaults to 8080.

## Running the Application

1. Set all required environment variables.
2. Use `cargo run` to build and start the application.
3. The application will listen for WebSocket connections on `WS_PORT` and send OSC messages to `OSC_HOST` and `OSC_PORT`.

## Functionality

- Initiates a WebSocket server on `WS_PORT`.
- Connects a UDP socket to `OSC_HOST` and `OSC_PORT`.
- Converts incoming WebSocket binary messages (DMX data) into OSC messages.
- Forwards OSC messages using the UDP socket.
- OSC address format: `/{dmx_universe}/{channel}`.

## Error Handling

- Requires certain environment variables; exits if not set or invalid.
- Logs errors related to WebSocket and OSC communications.

## Future Enhancements

- Enhanced error handling and application resilience.
- Configurable DMX channel size.
- Advanced logging and debugging.
