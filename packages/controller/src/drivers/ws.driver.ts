import type { Channels } from '@webdmx/common';

import { NetworkDriver, type NetworkDriverOptions } from './base/network.driver.js';

export type WsDriverOptions = NetworkDriverOptions & {
  url: URL;
};

export default class WsDriver extends NetworkDriver<WsDriverOptions> {
  #socket?: WebSocket;

  constructor() {
    super({ url: new URL('ws://localhost:8080') });
  }

  override async connect() {
    this.#socket = new WebSocket(this.options.url);
  }

  override async disconnect() {
    this.#socket?.close();
  }

  override update(channels: Channels): void {
    super.update(channels);
    this.#send(this.universe);
  }

  override updateFrom(from: number, values: ArrayLike<number>): void {
    super.updateFrom(from, values);
    this.#send(this.universe);
  }

  override updateAll(value: number): void {
    super.updateAll(value);
    this.#send(this.universe);
  }

  #send(universe: Uint8Array) {
    this.#socket?.send(universe);
  }
}
