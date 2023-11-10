# WebDMX UI

A simple UI for controlling DMX lights in the browser via USB.

## Development

For using the Web USB API, a secure context is necessary. This means that the site must be served over HTTPS. For development, you can use the following command to create a self-signed certificate:

```bash
brew install mkcert
brew install nss
mkcert -install
mkcert -cert-file .ssl/local.cert -key-file .ssl/local.key localhost
```

Then, you can run the development server with:

```bash
npm run dev
```

## Concepts

### State Management

The UI should manage several states globally to prevent prop drilling and to reduce repetitive tasks like lazy loading of large predefined data sets (e.g. device presets). So persisting and hydrating state as well as reflecting it to the DMX controller should be somehow decoupled.

#### Stateful data

The idea is to handle state for the following concerns:

- **Universe**, which contains the currently used 512 DMX channel values
- **Configuration**, for devices to be used in the universe along with some meta data (like position, appearance, etc.) and to store generic universe settings (like the driver to be used and its settings)
- Device **presets**, which are loaded lazily once requested and contain configuration options for devices (provided by the [@webdmx/controller](../controller/presets))

#### Criteria

So the state should not only be modified by components, but changes shall reflect to all consumers as well. Changes to the universe may be reflected to all consumers entirely, but configuring a single device should not trigger a refresh on all other devices. So the state should be chunked into slices, which can be subscribed to individually.

Additionally, the state may be reflected from and to some persistent storage, so that it can be restored on page reload or synchronized. To round things up, some clever reflection of the universe state to the DMX controller would be neat, with some fancy decoupling.

- centralized state separated from presentational components
- chunked into slices to allow some categorization
- pluggable persistence layer, controller reflection, maybe even declarative side effects

#### Existing solutions

So using some **Redux** like state may be a good idea, as it provides a single source of truth and is covered by a lot of tooling.

On the other hand the **[Context Community Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md) implemented via the [`@lit/context` package](https://lit.dev/docs/data/context/)** can be considered or just taken as inspiration.

Additionally a simple implementation based on **Signals** may be considered as well. The [Lit Labs implementation of Preact Signals](https://github.com/lit/lit/tree/main/packages/labs/preact-signals) may be a good starting point.
