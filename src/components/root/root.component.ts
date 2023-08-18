import { DMX } from 'dmx-ts';
import { LitElement, type TemplateResult, html, unsafeCSS } from 'lit';
import { customElement, eventOptions } from 'lit/decorators.js';

import { implicitlyRequestPermissions } from '@/utils/usb.utils.js';

import styles from './root.component.scss?inline';

/**
 * @element dmxui-root
 */
@customElement('dmxui-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #dmx = new DMX();

  @eventOptions({ passive: true })
  private async handleClick() {
    const device = await implicitlyRequestPermissions();
    if (!device) return;

    console.log(device);
    console.log(this.#dmx);
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
