# DMX

A project to control DMX lights in a browser.

Derived from Node implementation in [`dmx-ts`](https://github.com/node-dmx/dmx-ts).

Based on [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API), which is [currently only supported in Chrome](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

The whole thing is packaged into an [Electron](https://www.electronjs.org/) app as well, just to check if it works.

## tl;dr

```bash
pnpm i
pnpm -r build

# run only controller watch build
pnpm -r --filter @webdmx/controller dev

# run only ui development server
pnpm -r --filter @webdmx/ui dev
```

## Update dependencies

Bump dependencies to latest version in all packages:
  
```bash
pnpm -r exec pnpx npm-check-updates -u
```
