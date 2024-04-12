import type { Universe } from '@webdmx/common';

import { AbstractDriver, CHANNELS } from './abstract.driver.js';

export type NetworkDriverOptions = {
  url: URL;
};

/**
 * Manages a network connection. The following lifecycle is expected:
 * 1. connect()
 * 4. update() or updateAll()
 * 7. disconnect()
 */
export class NetworkDriver<
  DriverOptions extends NetworkDriverOptions = NetworkDriverOptions,
> extends AbstractDriver<NetworkDriverOptions> {
  readonly universe: Universe = new Uint8Array(CHANNELS);

  constructor(override options: DriverOptions) {
    super();
  }

  override async connect() {
    // nothing to do here
  }

  override async disconnect() {
    // nothing to do here
  }

  override async open() {
    // nothing to do here
  }

  override async close() {
    // nothing to do here
  }
}
