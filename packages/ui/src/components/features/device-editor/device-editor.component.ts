import type { Preset } from '@webdmx/common';
import { DMX } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

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

  @eventOptions({ passive: true })
  private async handlePresetChange(event: InputEvent) {
    // read the selected preset name
    const { value: preset } = event.target as HTMLInputElement;
    // prevent loading the same preset twice
    if (this.#device?.preset === preset) return;
    // select first profile
    const profile = Object.keys(this.presets[preset!]?.profiles ?? {})[0];
    // emit the change event
    this.#emitChangeEvent({ ...this.#device, preset, profile });
  }

  @eventOptions({ passive: true })
  private async handleProfileChange(event: InputEvent) {
    // read the selected profile name
    const { value: profile } = event.target as HTMLInputElement;
    // prevent loading the same profile twice
    if (this.#device?.profile === profile) return;
    // emit the change event
    this.#emitChangeEvent({ ...this.#device, profile });
  }

  #emitChangeEvent(device: Readonly<Partial<DeviceData>>) {
    const event = new CustomEvent('webdmx-device-editor:change', { detail: device });
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      <form>
        <input type="number" min="0" max="512" value="${ifDefined(this.#device?.address)}" />

        <select @change="${this.handlePresetChange}">
          ${map(
            Object.keys(this.presets),
            (preset) => html`
              <option value="${preset}" ?selected="${preset === this.#device?.preset}">${preset}</option>
            `,
          )}
        </select>

        ${when(
          this.#device?.preset !== undefined,
          () => html`
            <select @change="${this.handleProfileChange}">
              ${map(
                Object.keys(this.presets[this.#device!.preset!]?.profiles ?? {}),
                (profile) =>
                  html`<option value="${profile}" ?selected="${profile === this.#device?.profile}">${profile}</option>`,
              )}
            </select>
          `,
        )}
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
