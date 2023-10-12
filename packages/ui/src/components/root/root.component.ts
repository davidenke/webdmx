import { DMX, EnttecOpenUSBDMXDriver, type Preset, type Slider } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

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
  @state() presets: Record<string, Preset | undefined> = Object.fromEntries(
    this.#dmx.presetNames.map((name) => [name, undefined]),
  );
  @state() selectedPreset: string = this.#dmx.presetNames[0];
  @state() selectedProfile?: string;

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
  private async handleConnectClick() {
    await this.#dmx.addUniverse('default', this.#driver);
    this.#driver.addEventListener('staging', this.#handleStaging);
    this.connected = true;
  }

  @eventOptions({ passive: true })
  private async handleDisconnectClick() {
    this.#dmx.updateAll('default', 0);

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.#driver.removeEventListener('staging', this.#handleStaging);
    await this.#dmx.close();
    this.connected = false;
  }

  @eventOptions({ passive: true })
  private updateRangeInput(event: InputEvent) {
    const { dataset, valueAsNumber } = event.target as HTMLInputElement;
    const { channel } = dataset;
    this.#dmx.update('default', { [parseInt(channel!)]: valueAsNumber });
  }

  @eventOptions({ passive: true })
  private async handlePresetChange(event: InputEvent) {
    // read the selected preset name
    const { value: name } = event.target as HTMLInputElement;
    this.selectedPreset = name;
    this.selectedProfile = undefined;
    // load preset if missing
    this.#loadPreset(this.selectedPreset);
  }

  @eventOptions({ passive: true })
  private async handleProfileChange(event: InputEvent) {
    // read the selected profile name
    const { value: name } = event.target as HTMLInputElement;
    this.selectedProfile = name;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#loadPreset(this.selectedPreset);
  }

  override async disconnectedCallback() {
    await this.#dmx.close();
    super.disconnectedCallback();
  }

  async #loadPreset(name: string) {
    // load preset if missing
    if (this.presets[name] === undefined) {
      this.presets[name] = await this.#dmx.loadPreset(name);
    }
    if (this.selectedProfile === undefined) {
      this.selectedProfile = Object.keys(this.presets[name]?.profiles ?? {})[0];
    }
  }

  #renderRange(control: Slider, channel: number): TemplateResult {
    return html`
      <label>
        ${control.label}
        <input
          type="range"
          min="${control.from}"
          max="${control.to}"
          step="${control.step}"
          data-channel="${`${channel}`}"
          ?disabled="${!this.connected}"
          .valueAsNumber="${0}"
          @input="${this.updateRangeInput}"
        />
      </label>
    `;
  }

  protected override render(): TemplateResult {
    return html`
      <button ?disabled="${!this.idle || this.connected}" @click="${this.handleConnectClick}">Connect</button>
      <button ?disabled="${!this.idle || !this.connected}" @click="${this.handleDisconnectClick}">Disconnect</button>

      <section>
        <nav>
          <select ?disabled="${!this.connected}" @change="${this.handlePresetChange}">
            ${Object.keys(this.presets).map(
              (name) => html`<option ?selected="${this.selectedPreset === name}" .value="${name}">${name}</option>`,
            )}
          </select>

          <select ?disabled="${!this.connected}" @change="${this.handleProfileChange}">
            ${Object.keys(this.presets[this.selectedPreset]?.profiles ?? {}).map(
              (name) => html`<option ?selected="${this.selectedProfile === name}" .value="${name}">${name}</option>`,
            )}
          </select>
        </nav>

        <menu>
          ${this.presets[this.selectedPreset]?.profiles?.[this.selectedProfile!]?.channels?.map(
            (channel, index) =>
              html` ${choose(this.presets[this.selectedPreset]?.controls?.[channel]?.type, [
                [
                  'slider',
                  () => this.#renderRange(this.presets[this.selectedPreset]?.controls?.[channel] as Slider, index),
                ],
              ])}`,
          )}
        </menu>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wcp-root': Root;
  }
}
