import { PRESET_NAMES } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import styles from './device-parameter-editor.component.scss?inline';

export type DeviceParameterEditorChangeEvent = CustomEvent<Partial<DeviceData>>;
export type DeviceParameterEditorAddressFocusEvent = CustomEvent<boolean>;

/**
 * @element webdmx-device-parameter-editor
 */
@customElement('webdmx-device-parameter-editor')
export class DeviceParameterEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #deviceData?: Readonly<Partial<DeviceData>>;

  @state()
  private presets = presets;

  @state()
  private selectedPreset?: string;

  @property({ type: Object, attribute: false, noAccessor: true })
  set deviceData(device: Readonly<Partial<DeviceData>> | undefined) {
    // update internal state
    this.#deviceData = device;
    this.selectedPreset = device?.preset;

    // update presets with detailed information
    this.presets.load(this.selectedPreset).then(() => this.requestUpdate());
  }

  @eventOptions({ passive: true })
  private async handlePresetChange({ target }: Event) {
    const select = target as HTMLSelectElement;
    this.selectedPreset = select.value;
    await this.presets.load(this.selectedPreset);
    this.requestUpdate('presets');
  }

  @eventOptions({ capture: true })
  private handleAddressFocus(event: FocusEvent) {
    this.#emitAddressFocusEvent(event.target, true);
  }

  @eventOptions({ capture: true })
  private handleAddressBlur(event: FocusEvent) {
    this.#emitAddressFocusEvent(event.target, false);
  }

  @eventOptions({ capture: true })
  private handleSubmit(event: SubmitEvent) {
    // prevent reload
    event.preventDefault();
    // read the form data
    const form = event.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form)) as Partial<DeviceData>;
    // emit the change event
    this.#emitChangeEvent({ ...this.#deviceData, ...data });
  }

  #emitAddressFocusEvent(target: EventTarget | null, focusInside: boolean) {
    const options = { detail: focusInside, bubbles: true, composed: true };
    const repeat = new CustomEvent('webdmx-device-parameter-editor:address-focus', options);
    target?.dispatchEvent(repeat);
  }

  #emitChangeEvent(device: Readonly<Partial<DeviceData>>) {
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
        <input
          required
          name="address"
          type="number"
          min="1"
          max="512"
          @focusin="${this.handleAddressFocus}"
          @focusout="${this.handleAddressBlur}"
          value="${ifDefined(this.#deviceData?.address)}"
        />

        <select required name="preset" @change="${this.handlePresetChange}">
          <option disabled value="" ?selected="${this.#deviceData?.preset === undefined}"></option>
          ${map(
            PRESET_NAMES,
            (preset) => html`
              <option value="${preset}" ?selected="${preset === this.#deviceData?.preset}">${preset}</option>
            `,
          )}
        </select>

        <select required name="profile" ?disabled="${this.selectedPreset === undefined}">
          <option disabled value="" ?selected="${this.#deviceData?.profile === undefined}"></option>
          ${map(
            this.presets.getProfileNames(this.selectedPreset),
            (profile) =>
              html`<option value="${profile}" ?selected="${profile === this.#deviceData?.profile}">${profile}</option>`,
          )}
        </select>

        <button type="submit">Save</button>
      </form>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-device-parameter-editor:address-focus': DeviceParameterEditorAddressFocusEvent;
    'webdmx-device-parameter-editor:change': DeviceParameterEditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-parameter-editor': DeviceParameterEditor;
  }
}
