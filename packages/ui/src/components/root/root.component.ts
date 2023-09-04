import { LitElement, type TemplateResult, html, unsafeCSS } from 'lit';
import { customElement, eventOptions, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { DMX, EnttecOpenUSBDMXDriver } from '@webdmx/controller';

import styles from './root.component.scss?inline';

/**
 * @element webdmxui-root
 */
@customElement('webdmxui-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #dmx = new DMX();
  #driver = new EnttecOpenUSBDMXDriver();

  #stagingTimeout?: number;
  #handleStaging = this.handleStaging.bind(this);

  @state() idle = true;
  @state() connected = false;

  @state() r = 0;
  @state() g = 0;
  @state() b = 0;
  @state() a = 0;

  @eventOptions({ passive: true })
  private handleStaging({ detail }: CustomEvent<boolean>) {
    // positive staging events are set immediately, but
    // negative staging events are delayed to prevent flickering
    if (detail) {
      window.clearTimeout(this.#stagingTimeout);
      this.idle = false;
      this.#stagingTimeout = window.setTimeout(() => (this.idle = true), 200);
    } else if (!this.#stagingTimeout) {
      this.idle = true;
    }
  }

  @eventOptions({ passive: true })
  private async connect() {
    await this.#dmx.addUniverse('default', this.#driver);
    this.#driver.addEventListener('staging', this.#handleStaging);
    this.connected = true;
  }

  @eventOptions({ passive: true })
  private async disconnect() {
    this.r = this.g = this.b = this.a = 0;
    this.#dmx.updateAll('default', 0);

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.#driver.removeEventListener('staging', this.#handleStaging);
    await this.#dmx.close();
    this.connected = false;
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
      <pre>${this.idle ? 'idle' : 'sending'}</pre>
      <button ?disabled="${!this.idle || this.connected}" @click="${this.connect}">Connect</button>
      <button ?disabled="${!this.idle || !this.connected}" @click="${this.disconnect}">Disconnect</button>

      <menu style="${styleMap({ '--r': `${this.r}`, '--g': `${this.g}`, '--b': `${this.b}`, '--a': `${this.a}` })}">
        ${this.#renderRange('R', 'r', 1)} ${this.#renderRange('G', 'g', 2)} ${this.#renderRange('B', 'b', 3)}
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
