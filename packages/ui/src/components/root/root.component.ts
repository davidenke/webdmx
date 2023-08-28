import { DMX, EnttecOpenUSBDMXDriver, NullDriver } from '@webdmx/controller';

import { LitElement, type TemplateResult, html, unsafeCSS } from 'lit';
import { customElement, eventOptions, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import styles from './root.component.scss?inline';

/**
 * @element webdmxui-root
 */
@customElement('webdmxui-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #dmx = new DMX();

  @state() connected = false;

  @state() r = 0;
  @state() g = 0;
  @state() b = 0;
  @state() a = 0;

  @eventOptions({ passive: true })
  private async connectSerial() {
    this.#dmx.addUniverse('default', new EnttecOpenUSBDMXDriver());
    this.connected = true;
  }

  override async disconnectedCallback() {
    await this.#dmx.close();
    super.disconnectedCallback();
  }

  @eventOptions({ passive: true })
  private updateRange(event: InputEvent) {
    const { dataset, valueAsNumber } = event.target as HTMLInputElement;
    const { channel, prop } = dataset;
    this[prop as keyof this] = valueAsNumber as any;
    this.#dmx.update('default', { [parseInt(channel!)]: valueAsNumber });
  }

  #renderRange(label: string, prop: 'r' | 'g' | 'b' | 'a', channel: number): TemplateResult {
    return html`
      <label>
        ${label}
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          data-channel="${`${channel}`}"
          data-prop="${prop}"
          ?disabled="${!this.connected}"
          .valueAsNumber="${this[prop]}"
          @input="${this.updateRange}"
        />
        ${this[prop]}
      </label>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <button @click="${this.connectSerial}">Connect</button>

      <menu style="${styleMap({ '--r': `${this.r}`, '--g': `${this.g}`, '--b': `${this.b}`, '--a': `${this.a}` })}">
        ${this.#renderRange('R', 'r', 2)}
        ${this.#renderRange('G', 'g', 3)}
        ${this.#renderRange('B', 'b', 4)}
        ${this.#renderRange('A', 'a', 0)}
      </menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wcp-root': Root;
  }
}
