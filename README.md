# DMX

A project to control DMX lights in a browser.

Derived from Node implementation in [`dmx-ts`](https://github.com/node-dmx/dmx-ts).

Based on [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API), which is [currently only supported in Chrome](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

## tl;dr

```bash
pnpm i
pnpm -r build
pnpm -r --filter @webdmx/ui dev
```
