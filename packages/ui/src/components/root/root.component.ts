import type { Preset, Slider } from '@webdmx/common';
import { DMX, type DriverName, type SerialDriver } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { when } from 'lit/directives/when.js';

import { type Data, loadData } from '../../utils/data.utils.js';
import styles from './root.component.scss?inline';

/**
 * @element webdmx-root
 */
@customElement('webdmx-root')
export class Root extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #data?: Data;

  #dmx = new DMX();
  #driver!: SerialDriver;

  #transferringTimeout?: number;
  #handleTransferring = this.handleTransferring.bind(this);

  @state() editing = false;
  @state() canPreview = true;
  @state() idle = true;
  @state() connected = false;
  @state() selectedUniverse?: string;
  @state() presets: Record<string, Preset | undefined> = Object.fromEntries(
    DMX.presetNames.map((name) => [name, undefined]),
  );
  @state() selectedPreset: string = DMX.presetNames[0];
  @state() selectedProfile?: string;

  @eventOptions({ passive: true })
  private handleModeChange() {
    this.editing = !this.editing;
  }

  @eventOptions({ passive: true })
  private handleTransferring({ detail }: CustomEvent<boolean>) {
    // positive transferring events are set immediately, but
    // negative transferring events are delayed to prevent flickering
    if (detail) {
      window.clearTimeout(this.#transferringTimeout);
      this.idle = false;
      this.#transferringTimeout = window.setTimeout(() => (this.idle = true), 200);
    } else if (!this.#transferringTimeout) {
      this.idle = true;
    }
  }

  @eventOptions({ passive: true })
  private handleUniverseChange(event: InputEvent) {
    const { value } = event.target as HTMLInputElement;
    this.selectedUniverse = value;
  }

  @eventOptions({ passive: true })
  private async handleConnectClick() {
    await this.#dmx.addUniverse('default', this.#driver);
    this.#driver.addEventListener('transferring', this.#handleTransferring);
    this.connected = true;
  }

  @eventOptions({ passive: true })
  private async handleDisconnectClick() {
    this.#dmx.updateAll('default', 0);

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.#driver.removeEventListener('transferring', this.#handleTransferring);
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

  override async connectedCallback() {
    super.connectedCallback();

    // load stored data (or initialize with empty data)
    this.#data = await loadData();
    // pre-select the first universe if only one is available
    if (this.#data.universes.length === 1) {
      this.selectedUniverse = this.#data.universes[0].label;
    }
    // prevent preview mode if no universes are configured
    if (!this.#data.universes.length) {
      this.canPreview = false;
      this.editing = true;
    }

    this.#loadPreset(this.selectedPreset);

    const driverName: DriverName = 'enttec-open-dmx-usb';
    const driver = await DMX.loadDriver(driverName);

    if (!driver) throw new Error(`Driver "${driverName}" not found`);
    this.#driver = new driver();
  }

  override async disconnectedCallback() {
    await this.#dmx.close();
    super.disconnectedCallback();
  }

  async #loadPreset(name: string) {
    // load preset if missing
    if (this.presets[name] === undefined) {
      this.presets[name] = await DMX.loadPreset(name);
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
      <webdmx-layout>
        <nav slot="header">
          ${when(
            this.#data?.universes.length,
            () => html`
              <select @change="${this.handleUniverseChange}">
                ${this.#data!.universes.map(({ label }) => html`<option .value="${label}">${label}</option>`)}
              </select>
              <button ?disabled="${!this.idle || this.connected}" @click="${this.handleConnectClick}">Connect</button>
              <button ?disabled="${!this.idle || !this.connected}" @click="${this.handleDisconnectClick}">
                Disconnect
              </button>
            `,
            () => html`<span>No universes configured</span>`,
          )}

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

        <nav slot="header">
          <webdmx-switch
            ?active="${this.editing}"
            ?disabled="${!this.canPreview}"
            @webdmx-switch:toggle="${this.handleModeChange}"
          >
            <span slot="off">Preview</span>
            <span slot="on">Edit</span>
          </webdmx-switch>
        </nav>

        ${this.editing ? html`<webdmx-editor></webdmx-editor>` : html`<webdmx-preview></webdmx-preview>`}

        <menu slot="footer">
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
      </webdmx-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-root': Root;
  }
}
