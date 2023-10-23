import type { Preset } from '@webdmx/common';
import { DMX } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import type { DeviceData, UniverseData } from '../../../utils/data.utils.js';
import { loadPreset } from '../../../utils/preset.utils.js';
import styles from './editor.component.scss?inline';

export type EditorChangeEvent = CustomEvent<{ index: number; device: Partial<DeviceData> }>;

/**
 * @element webdmx-editor
 */
@customElement('webdmx-editor')
export class Editor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #universe?: Readonly<UniverseData>;

  @state()
  presets: Record<string, Preset | null> = Object.fromEntries(DMX.presetNames.map((name) => [name, null]));

  @property({ type: Object, attribute: false, noAccessor: true })
  set universe(universe: Readonly<UniverseData> | undefined) {
    // update internal state
    this.#universe = universe;

    // update presets with detailed information
    const names = this.#universe?.devices.map(({ preset }) => preset) ?? [];
    loadPreset(this.presets, ...names).then((presets) => {
      this.presets = presets;
      this.requestUpdate();
    });
  }

  @eventOptions({ passive: true })
  private async handlePresetChange(event: InputEvent) {
    // read the selected preset name
    const { dataset, value: preset } = event.target as HTMLInputElement;
    // pick corresponding device
    const index = parseInt(dataset.deviceIndex!);
    const device = this.#universe?.devices?.[index];
    // prevent loading the same preset twice
    if (device?.preset === preset) return;
    // select first profile
    const profile = Object.keys(this.presets[preset!]?.profiles ?? {})[0];
    // emit the change event
    this.#emitChangeEvent(index, { ...device, preset, profile });
  }

  @eventOptions({ passive: true })
  private async handleProfileChange(event: InputEvent) {
    // read the selected profile name
    const { dataset, value: profile } = event.target as HTMLInputElement;
    // emit the change event
    const index = parseInt(dataset.deviceIndex!);
    const device = this.#universe?.devices?.[index];
    // prevent loading the same profile twice
    if (device?.profile === profile) return;
    // emit the change event
    this.#emitChangeEvent(index, { ...device, profile });
  }

  #emitChangeEvent(index: number, device: Partial<DeviceData>) {
    const detail = { index, device } satisfies EditorChangeEvent['detail'];
    const event = new CustomEvent('webdmx-editor:change', { detail });
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      ${map(
        this.#universe?.devices ?? [],
        (device, index) => html`
          <form>
            <input type="number" min="0" max="512" value="${ifDefined(device.address)}" />

            <select data-device-index="${index}" @change="${this.handlePresetChange}">
              ${map(
                Object.keys(this.presets),
                (preset) => html`<option value="${preset}" ?selected="${preset === device.preset}">${preset}</option>`,
              )}
            </select>

            ${when(
              device.preset !== undefined,
              () => html`
                <select data-device-index="${index}" @change="${this.handleProfileChange}">
                  ${map(
                    Object.keys(this.presets[device.preset!]?.profiles ?? {}),
                    (profile) =>
                      html`<option value="${profile}" ?selected="${profile === device.profile}">${profile}</option>`,
                  )}
                </select>
              `,
            )}
          </form>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-editor:change': EditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-editor': Editor;
  }
}
