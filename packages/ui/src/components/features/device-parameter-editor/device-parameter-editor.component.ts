import { PRESET_NAMES } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import styles from './device-parameter-editor.component.scss?inline';

export type DeviceParameterEditorChangeEvent = CustomEvent<Partial<DeviceData>>;

/**
 * @element webdmx-device-parameter-editor
 * @emits webdmx-device-parameter-editor:change - When the device data has been altered.
 */
@customElement('webdmx-device-parameter-editor')
export class DeviceParameterEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #device?: Readonly<Partial<DeviceData>>;

  @state()
  private presets = presets;

  @state()
  private selectedPreset?: string;

  @property({ type: Object, attribute: false, noAccessor: true })
  set device(device: Readonly<Partial<DeviceData>> | undefined) {
    // update internal state
    this.#device = device;
    this.selectedPreset = device?.preset;

    // update presets with detailed information
    this.presets.load(this.selectedPreset).then(() => this.requestUpdate());
  }

  @property({ type: Array, attribute: false })
  reservedAddresses: number[] = [];

  @eventOptions({ passive: false })
  handleAddressInput(event: InputEvent) {
    const target = event.target as HTMLInputElement;
    if (this.reservedAddresses.includes(target.valueAsNumber)) {
      target.setCustomValidity('Address is already in use.');
    } else {
      target.setCustomValidity('');
    }
  }

  @eventOptions({ passive: true })
  private async handlePresetChange({ target }: Event) {
    const select = target as HTMLSelectElement;
    this.selectedPreset = select.value;
    await this.presets.load(this.selectedPreset);
    this.requestUpdate('presets');
  }

  @eventOptions({ capture: true })
  private handleSubmit(event: SubmitEvent) {
    // prevent reload
    event.preventDefault();

    // check if the form is valid
    const form = event.target as HTMLFormElement;
    if (!form.checkValidity()) return;

    // read the form data
    const data = Object.fromEntries(new FormData(form)) as Partial<DeviceData>;
    data.address = Number(data.address);
    // emit the change event
    this.#emitChangeEvent({ ...this.#device, ...data });
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
          autocomplete="off"
          inputmode="numeric"
          name="address"
          type="number"
          min="1"
          max="512"
          value="${ifDefined(this.#device?.address)}"
          @input="${this.handleAddressInput}"
        />

        <select required name="preset" autocomplete="off" @change="${this.handlePresetChange}">
          <option disabled value="" ?selected="${this.#device?.preset === undefined}"></option>
          ${map(
            PRESET_NAMES,
            (preset) => html`
              <option value="${preset}" ?selected="${preset === this.#device?.preset}">${preset}</option>
            `,
          )}
        </select>

        <select required name="profile" autocomplete="off" ?disabled="${this.selectedPreset === undefined}">
          <option disabled value="" ?selected="${this.#device?.profile === undefined}"></option>
          ${map(
            this.presets.getProfileNames(this.selectedPreset),
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
