// Import specific Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';

import { PRESETS } from '@webdmx/controller';
import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
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
  private selectedPreset?: string;

  @state()
  private profileNames: readonly string[] = [];

  @property({ type: Object, attribute: false, noAccessor: true })
  set device(device: Readonly<Partial<DeviceData>> | undefined) {
    // Deep comparison to avoid unnecessary updates when object reference changes
    // but the actual data is the same
    if (this.#device === device) return;
    
    // Check if the actual content is the same
    if (
      this.#device &&
      device &&
      this.#device.preset === device.preset &&
      this.#device.profile === device.profile &&
      this.#device.address === device.address
    ) {
      return;
    }

    // Update internal state
    this.#device = device;
    
    // Only update selectedPreset if it actually changed
    const newPreset = device?.preset;
    if (this.selectedPreset !== newPreset) {
      this.selectedPreset = newPreset;
      
      // Only load preset data if we have a new preset
      if (newPreset) {
        this.#loadPresetAndUpdateProfiles(newPreset);
      }
    }
  }

  @property({ type: Array, attribute: false })
  reservedAddresses: number[] = [];

  @eventOptions({ passive: false })
  handleAddressInput(event: CustomEvent) {
    const target = event.target as HTMLElement & { value: string; setCustomValidity: (message: string) => void };
    const value = parseInt(target.value);
    if (this.reservedAddresses.includes(value)) {
      target.setCustomValidity('Address is already in use.');
    } else {
      target.setCustomValidity('');
    }
  }

  @eventOptions({ passive: true })
  private async handlePresetChange({ target }: Event) {
    const select = target as HTMLElement & { value: string };
    this.selectedPreset = select.value;
    await this.#loadPresetAndUpdateProfiles(this.selectedPreset);
  }

  async #loadPresetAndUpdateProfiles(presetName: string) {
    // Avoid redundant loading if preset is already loaded and profiles are set
    const existingProfileNames = presets.getProfileNames(presetName);
    if (existingProfileNames.length > 0 && this.profileNames.length > 0) {
      // Just update profiles if preset is already loaded
      this.profileNames = existingProfileNames;
      return;
    }
    
    // Load preset and update profiles
    await presets.load(presetName);
    this.profileNames = presets.getProfileNames(presetName);
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
        <sl-input
          required
          autocomplete="off"
          inputmode="numeric"
          name="address"
          type="number"
          min="1"
          max="512"
          label="Address"
          size="small"
          @sl-input="${this.handleAddressInput}"
        ></sl-input>

        <sl-select
          required
          name="preset"
          autocomplete="off"
          label="Preset"
          size="small"
          value="${ifDefined(this.selectedPreset)}"
          @sl-change="${this.handlePresetChange}"
        >
          ${map(PRESETS, ([preset, label]) => html`<sl-option value="${preset}">${label}</sl-option>`)}
        </sl-select>

        <sl-select
          required
          name="profile"
          autocomplete="off"
          label="Profile"
          size="small"
          value="${ifDefined(this.#device?.profile)}"
          ?disabled="${this.selectedPreset === undefined}"
        >
          ${map(this.profileNames, (profile) => html`<sl-option value="${profile}">${profile}</sl-option>`)}
        </sl-select>

        <sl-button type="submit" variant="primary" size="small">Save</sl-button>
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
