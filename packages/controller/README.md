# DMC controller

Forked from [`webdmx-ts`](https://github.com/node-webdmx/webdmx-ts).

To make it work in the browser the following major changes have been made:

- ESM build
- Removed `serialport` runtime dependency, but use the types
- Removed non-serial drivers
- use `EventEmitter` from `events` package for browser (will be replaced by a native API as well)
