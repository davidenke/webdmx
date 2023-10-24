import type { Preset } from '@webdmx/common';
import { DMX } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import type { DeviceData, UniverseData } from '../../../utils/data.utils.js';
import { loadPreset } from '../../../utils/preset.utils.js';
import type { DeviceEditor, DeviceEditorChangeEvent } from '../device-editor/device-editor.component.js';
import styles from './editor.component.scss?inline';

export type EditorChangeEvent = CustomEvent<Partial<DeviceData>[]>;

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
  private async handleDeviceChange({ detail, target }: DeviceEditorChangeEvent) {
    // read the selected index and data
    const { dataset } = target as DeviceEditor;
    const index = parseInt(dataset.deviceIndex!);
    // update corresponding device
    const devices = this.#universe?.devices?.slice() ?? [];
    devices[index] = { ...this.#universe?.devices?.[index], ...detail };
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ passive: true })
  private async handleAddDeviceClick() {
    // update corresponding device
    const devices = [...(this.#universe?.devices ?? []), {}];
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  #emitChangeEvent(devices: Partial<DeviceData>[]) {
    const event = new CustomEvent('webdmx-editor:change', { detail: devices });
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      ${map(
        this.#universe?.devices ?? [],
        (device, index) => html`
          <webdmx-device-editor
            data-device-index="${index}"
            .device="${device}"
            @webdmx-device-editor:change="${this.handleDeviceChange}"
          ></webdmx-device-editor>
        `,
      )}

      <button @click="${this.handleAddDeviceClick}">Add device</button>
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
