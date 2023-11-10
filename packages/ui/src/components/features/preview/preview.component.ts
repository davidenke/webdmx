import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import styles from './preview.component.scss?inline';

export type PreviewDeviceSelectedEvent = CustomEvent<number[]>;

/**
 * @element webdmx-preview
 */
@customElement('webdmx-preview')
export class Preview extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #devices: Partial<DeviceData>[] = [];

  @state()
  presets = presets;

  @property({ type: Array, attribute: false })
  selectedDevices: number[] = [];

  @property({ type: Boolean, reflect: true })
  connected: boolean = false;

  /**
   * The devices to be rendered. Consists of partial device data.
   */
  @property({ type: Array, attribute: false, noAccessor: true })
  set devices(devices: Partial<DeviceData>[] | undefined) {
    // update internal state
    this.#devices = devices ?? [];
    // update presets with detailed information
    const names = this.#devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => this.requestUpdate());
  }

  @eventOptions({ passive: true })
  private handleDeviceClick(event: MouseEvent) {
    const { dataset } = event.target as HTMLElement;
    const index = parseInt(dataset.deviceIndex!);

    if (this.selectedDevices.includes(index)) {
      const selectedDevices = this.selectedDevices.filter((i) => i !== index);
      this.#emitDeviceSelected(selectedDevices);
    } else {
      const selectedDevices = [...this.selectedDevices, index];
      this.#emitDeviceSelected(selectedDevices);
    }
  }

  #emitDeviceSelected(detail: number[]) {
    const event = new CustomEvent('webdmx-preview:device-selected', { detail, bubbles: true });
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      ${map(
        this.#devices,
        (device, index) => html`
          <webdmx-device-preview
            data-device-index="${index}"
            ?selected="${this.selectedDevices.includes(index)}"
            .device="${device}"
            @click="${this.handleDeviceClick}"
          ></webdmx-device-preview>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-preview:device-selected': PreviewDeviceSelectedEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-preview': Preview;
  }
}
