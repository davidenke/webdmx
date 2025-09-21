// Import specific Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';

import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { getReservedAddresses } from '../../../utils/device.utils.js';
import { isSameOrWithin } from '../../../utils/dom.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import type { PopupHiddenEvent } from '../../ui/popup/popup.component.js';

import styles from './device-editor.component.scss?inline';

export type DeviceEditorChangeEvent = CustomEvent<Partial<DeviceData>>;
export type DeviceEditorDuplicateEvent = CustomEvent<void>;
export type DeviceEditorRemoveEvent = CustomEvent<void>;

/**
 * @element webdmx-device-editor
 */
@customElement('webdmx-device-editor')
export class DeviceEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #devices: Partial<DeviceData>[] = [];
  #cachedDevice?: Partial<DeviceData>;
  #cachedDeviceIndex?: number;
  #handleClickOutside = this.handleClickOutside.bind(this);

  @state()
  private reservedAddresses: number[] = [];

  @state()
  private presets = presets;

  @property({ type: Boolean, reflect: true, attribute: 'parameter-editor-visible' })
  parameterEditorVisible = false;

  @property({ type: Number, reflect: true, attribute: 'device-index' })
  deviceIndex?: number;

  /**
   * The devices to be rendered. Consists of partial device data.
   */
  @property({ type: Array, attribute: false, noAccessor: true })
  set devices(devices: Partial<DeviceData>[] | undefined) {
    // update internal state
    this.#devices = devices ?? [];
    // clear device cache when devices change
    this.#cachedDevice = undefined;
    this.#cachedDeviceIndex = undefined;
    // update position
    if (this.deviceIndex !== undefined) {
      const { position } = this.#devices[this.deviceIndex];
      this.style.setProperty('--webdmx-device-editor-x', position?.x ? `${position?.x}px` : '50%');
      this.style.setProperty('--webdmx-device-editor-y', position?.y ? `${position?.y}px` : '50%');
    }
    // update presets with detailed information
    const names = this.#devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => {
      // derive reserved addresses
      const { reservedAddresses } = this;
      const without = this.deviceIndex !== undefined ? [this.deviceIndex] : [];
      this.reservedAddresses = getReservedAddresses(this.#devices, this.presets, without);
      this.requestUpdate('reservedAddresses', reservedAddresses);
    });
  }

  /**
   * Get the current device with memoization to prevent unnecessary re-renders
   */
  private getCurrentDevice(): Partial<DeviceData> | undefined {
    // Return cached device if index hasn't changed
    if (this.#cachedDeviceIndex === this.deviceIndex) {
      return this.#cachedDevice;
    }
    
    // Update cache
    this.#cachedDeviceIndex = this.deviceIndex;
    this.#cachedDevice = this.deviceIndex !== undefined ? this.#devices[this.deviceIndex] : undefined;
    
    return this.#cachedDevice;
  }

  @eventOptions({ passive: true })
  private handleParametersClick() {
    this.parameterEditorVisible = !this.parameterEditorVisible;
  }

  @eventOptions({ passive: true })
  private handleRemoveClick() {
    this.#emitRemoveEvent();
  }

  @eventOptions({ passive: true })
  private handleDuplicateClick() {
    this.#emitDuplicateEvent();
  }

  @eventOptions({ passive: true })
  private handleParametersHidden(event: PopupHiddenEvent) {
    this.parameterEditorVisible = !event.detail;
  }

  @eventOptions({ passive: true })
  private handleParametersChange() {
    this.parameterEditorVisible = false;
  }

  @eventOptions({ passive: true })
  private handleClickOutside(event: MouseEvent) {
    // do nothing if the popup is closed
    if (!this.parameterEditorVisible) return;

    // grab the source element of the target list
    const [target] = event.composedPath() as HTMLElement[];
    const isHost = isSameOrWithin([this], target);

    // close the popup if the click was outside
    if (!isHost) this.parameterEditorVisible = false;
  }

  #emitRemoveEvent() {
    const event = new CustomEvent('webdmx-device-editor:remove', { bubbles: true, composed: true });
    this.dispatchEvent(event);
  }

  #emitDuplicateEvent() {
    const event = new CustomEvent('webdmx-device-editor:duplicate', { bubbles: true, composed: true });
    this.dispatchEvent(event);
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.#handleClickOutside, false);
  }

  override disconnectedCallback() {
    window.removeEventListener('click', this.#handleClickOutside, false);
    super.disconnectedCallback();
  }

  override render(): TemplateResult {
    const device = this.getCurrentDevice();

    return html`
      <nav>
        <sl-button size="small" aria-label="Edit device parameters" @click="${this.handleParametersClick}">
          <webdmx-icon name="options"></webdmx-icon>
        </sl-button>
        <sl-button size="small" aria-label="Duplicate device in universe" @click="${this.handleDuplicateClick}">
          <webdmx-icon name="duplicate"></webdmx-icon>
        </sl-button>
        <sl-button
          size="small"
          variant="danger"
          aria-label="Remove device from universe"
          @click="${this.handleRemoveClick}"
        >
          <webdmx-icon name="trash"></webdmx-icon>
        </sl-button>
      </nav>

      <section>
        <span>${device?.preset}</span>
        <span>${device?.profile}</span>
        <span>${device?.address}</span>
      </section>

      <webdmx-popup
        aria-expanded="${String(this.parameterEditorVisible) as 'true' | 'false'}"
        .hidden="${!this.parameterEditorVisible}"
        @webdmx-popup:hidden="${this.handleParametersHidden}"
      >
        <webdmx-device-parameter-editor
          .device="${device}"
          .reservedAddresses="${this.reservedAddresses}"
          @webdmx-device-parameter-editor:change="${this.handleParametersChange}"
        ></webdmx-device-parameter-editor>
      </webdmx-popup>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-device-editor:duplicate': DeviceEditorDuplicateEvent;
    'webdmx-device-editor:remove': DeviceEditorRemoveEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-editor': DeviceEditor;
  }
}
