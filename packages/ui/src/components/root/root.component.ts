import { type Channels, type Driver, DMX, NullDriver } from '@webdmx/controller';
import { LitElement, type TemplateResult, html, unsafeCSS } from 'lit';
import { customElement, eventOptions } from 'lit/decorators.js';

import { implicitlyRequestPermissions } from '@/utils/usb.utils.js';

import styles from './root.component.scss?inline';

/**
 * @element webdmxui-root
 */
@customElement('webdmxui-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #device?: USBDevice;
  #dmx = new DMX();

  @eventOptions({ passive: true })
  private async handleClick() {
    // this.#device = await implicitlyRequestPermissions();
    // if (this.#device === undefined) return;

    // console.log(this.#device);
    // const { vendorId } = this.#device;

    // console.log(vendorId);
    // const port = await navigator.serial.requestPort({ filters: [{ usbVendorId: vendorId }] });
    // console.log(port);

    // that's basically the dmx-ts demo:
    const universe = await this.#dmx.addUniverse('demo', new NullDriver());

    let on = false;
    window.setInterval(() => {
      universe.updateAll(on ? 0 : 250);
      on = !on;
    }, 1000);

    // const universe = await this.#webdmx.addUniverse('demo', new NullDriver());

    // universe.update({ 1: 1, 2: 0 });
    // universe.update({ 16: 1, 17: 255 });
    // universe.update({ 1: 255, 3: 120, 4: 230, 5: 30, 6: 110, 7: 255, 8: 10, 9: 255, 10: 255, 11: 0 });

    // function greenWater(universe: Driver, channels: Channels, duration: number): void {
    //   const colors = [
    //     [160, 230, 20],
    //     [255, 255, 0],
    //     [110, 255, 10],
    //   ];

    //   for (const c in channels) {
    //     const r = Math.floor(Math.random() * colors.length);
    //     const u: Channels = {};

    //     for (let i = 0; i < 3; i++) {
    //       u[channels[c] + i] = colors[r][i];
    //     }
    //     new Animation().add(u, duration).run(universe);
    //   }
    //   setTimeout(() => greenWater(universe, channels, duration), duration * 2);
    // }

    // function warp(universe: Driver, channel: number, min: number, max: number, duration: number): void {
    //   const a: UniverseData = {};
    //   const b: UniverseData = {};

    //   a[channel] = min;
    //   b[channel] = max;
    //   new Animation()
    //     .add(a, duration)
    //     .add(b, duration)
    //     .run(universe, function () {
    //       warp(universe, channel, min, max, duration);
    //     });
    // }

    // warp(universe, 1, 200, 220, 360);
    // warp(universe, 1 + 15, 200, 255, 240);
    // greenWater(universe, [3, 6, 9], 4000);
    // greenWater(universe, [3 + 15, 6 + 15, 9 + 15], 4000);
  }

  override async disconnectedCallback() {
    super.disconnectedCallback();
    await this.#dmx.close();
    await this.#device?.close();
    await this.#device?.forget();
    this.#device = undefined;
  }

  protected override render(): TemplateResult {
    return html`
      <h1>Hello World!</h1>
      <button @click="${this.handleClick}">Select DMX device</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wcp-root': Root;
  }
}
