import type { Preset } from '@webdmx/common';
import { DMX } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { loadPreset } from '../../../utils/preset.utils.js';
import styles from './device-parameter-editor.component.scss?inline';

export type DeviceParameterEditorChangeEvent = CustomEvent<Partial<DeviceData>>;
export type DeviceParameterEditorRemoveEvent = CustomEvent<void>;

/**
 * @element webdmx-device-parameter-editor
 */
@customElement('webdmx-device-parameter-editor')
export class DeviceParameterEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #device?: Readonly<Partial<DeviceData>>;

  @state()
  private presets: Record<string, Preset | null> = Object.fromEntries(DMX.presetNames.map((name) => [name, null]));

  @state()
  private selectedPreset?: string;

  @property({ type: Object, attribute: false, noAccessor: true })
  set deviceData(device: Readonly<Partial<DeviceData>> | undefined) {
    // update internal state
    this.#device = device;
    this.selectedPreset = device?.preset;

    // update presets with detailed information
    loadPreset(this.presets, this.selectedPreset).then((presets) => {
      this.presets = presets;
      this.requestUpdate();
    });
  }

  @eventOptions({ passive: true })
  private async handlePresetChange({ target }: Event) {
    const select = target as HTMLSelectElement;
    this.selectedPreset = select.value;
    this.presets = await loadPreset(this.presets, this.selectedPreset);
  }

  @eventOptions({ capture: true })
  private handleSubmit(event: SubmitEvent) {
    // prevent reload
    event.preventDefault();
    // read the form data
    const form = event.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form)) as Partial<DeviceData>;
    // emit the change event
    this.#emitChangeEvent({ ...this.#device, ...data });
  }

  #emitChangeEvent(device: Readonly<Partial<DeviceData>>) {
    const event = new CustomEvent('webdmx-device-parameter-editor:change', { detail: device, bubbles: true });
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
