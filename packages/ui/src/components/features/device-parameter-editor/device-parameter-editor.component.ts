import type { PresetName } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';
import { use } from 'lit-shared-state';

import type { DeviceConfig } from '../../../state/config.state.js';
import { presets } from '../../../state/presets.state.js';
import styles from './device-parameter-editor.component.scss?inline';

export type DeviceParameterEditorChangeEvent = CustomEvent<Partial<DeviceConfig>>;
export type DeviceParameterEditorRemoveEvent = CustomEvent<void>;

/**
 * @element webdmx-device-parameter-editor
 */
@customElement('webdmx-device-parameter-editor')
export class DeviceParameterEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #device?: Readonly<Partial<DeviceConfig>>;

  @use() private presets = presets;

  @state() private selectedPreset?: PresetName;

  @property({ type: Object, attribute: false, noAccessor: true })
  set deviceData(device: Readonly<Partial<DeviceConfig>> | undefined) {
    // update internal state
    this.#device = device;
    this.selectedPreset = device?.preset as PresetName;

    // update presets with detailed information
    this.presets.loadPreset(this.selectedPreset).then(() => this.requestUpdate('deviceData'));
  }

  @eventOptions({ passive: true })
  private async handlePresetChange({ target }: Event) {
    const select = target as HTMLSelectElement;
    this.selectedPreset = select.value as PresetName;
    await this.presets.loadPreset(this.selectedPreset);
  }

  @eventOptions({ capture: true })
  private handleSubmit(event: SubmitEvent) {
    // prevent reload
    event.preventDefault();
    // read the form data
    const form = event.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form)) as Partial<DeviceConfig>;
    // emit the change event
    this.#emitChangeEvent({ ...this.#device, ...data });
  }

  #emitChangeEvent(device: Readonly<Partial<DeviceConfig>>) {
    const event = new CustomEvent('webdmx-device-parameter-editor:change', {
      detail: device,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      <form @submit="${this.handleSubmit}">
        <input required name="address" type="number" min="1" max="512" value="${ifDefined(this.#device?.address)}" />

        <select required name="preset" @change="${this.handlePresetChange}">
          <option disabled value="" ?selected="${this.#device?.preset === undefined}"></option>
          ${map(
            Object.keys(this.presets),
            (preset) => html`
              <option value="${preset}" ?selected="${preset === this.#device?.preset}">${preset}</option>
            `,
          )}
        </select>

        <select required name="profile" ?disabled="${this.selectedPreset === undefined}">
          <option disabled value="" ?selected="${this.#device?.profile === undefined}"></option>
          ${map(
            Object.keys(this.presets[this.selectedPreset!]?.profiles ?? {}),
            (profile) =>
              html`<option value="${profile}" ?selected="${profile === this.#device?.profile}">${profile}</option>`,
          )}
        </select>

        <button type="submit">Save</button>
      </form>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-device-parameter-editor:change': DeviceParameterEditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-parameter-editor': DeviceParameterEditor;
  }
}
