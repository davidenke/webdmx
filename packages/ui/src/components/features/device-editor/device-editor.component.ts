import type { Preset } from '@webdmx/common';
import { DMX } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { loadPreset } from '../../../utils/preset.utils.js';
import styles from './device-editor.component.scss?inline';

export type DeviceEditorChangeEvent = CustomEvent<Partial<DeviceData>>;

/**
 * @element webdmx-device-editor
 */
@customElement('webdmx-device-editor')
export class DeviceEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #device?: Readonly<Partial<DeviceData>>;

  @state()
  presets: Record<string, Preset | null> = Object.fromEntries(DMX.presetNames.map((name) => [name, null]));

  @property({ type: Object, attribute: false, noAccessor: true })
  set device(device: Readonly<Partial<DeviceData>> | undefined) {
    // update internal state
    this.#device = device;

    // update presets with detailed information
    loadPreset(this.presets, this.#device?.preset).then((presets) => {
      this.presets = presets;
      this.requestUpdate();
    });
  }

  @eventOptions({ capture: true })
  private async handleSubmit(event: SubmitEvent) {
    // prevent reload
    event.preventDefault();
    // read the form data
    const form = event.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form)) as Partial<DeviceData>;
    // emit the change event
    this.#emitChangeEvent({ ...this.#device, ...data });
  }

  #emitChangeEvent(device: Readonly<Partial<DeviceData>>) {
    const event = new CustomEvent('webdmx-device-editor:change', { detail: device });
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      <form @submit="${this.handleSubmit}">
        <input name="address" type="number" min="1" max="512" value="${ifDefined(this.#device?.address)}" />

        <select name="preset">
          ${map(
            Object.keys(this.presets),
            (preset) => html`
              <option value="${preset}" ?selected="${preset === this.#device?.preset}">${preset}</option>
            `,
          )}
        </select>

        <select name="profile" ?disabled="${this.#device?.preset === undefined}">
          ${map(
            Object.keys(this.presets[this.#device!.preset!]?.profiles ?? {}),
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
    'webdmx-device-editor:change': DeviceEditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-editor': DeviceEditor;
  }
}
