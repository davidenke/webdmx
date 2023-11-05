import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { getReservedAddresses } from '../../../utils/device.utils.js';
import { isSameOrWithin } from '../../../utils/dom.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import type { PopupHiddenEvent } from '../../ui/popup/popup.component.js';
import styles from './device-editor.component.scss?inline';

export type DeviceEditorChangeEvent = CustomEvent<Partial<DeviceData>>;
export type DeviceEditorRemoveEvent = CustomEvent<void>;

/**
 * @element webdmx-device-editor
 */
@customElement('webdmx-device-editor')
export class DeviceEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #devices: Partial<DeviceData>[] = [];
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
    // update presets with detailed information
    const names = this.#devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => {
      // derive reserved addresses
      const { reservedAddresses } = this;
      this.reservedAddresses = getReservedAddresses(this.#devices, this.presets, [this.deviceIndex!]);
      this.requestUpdate('reservedAddresses', reservedAddresses);
    });
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

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.#handleClickOutside, false);
  }

  override disconnectedCallback() {
    window.removeEventListener('click', this.#handleClickOutside, false);
    super.disconnectedCallback();
  }

  override render(): TemplateResult {
    return html`
      <nav>
        <button aria-label="Edit device parameters" @click="${this.handleParametersClick}">
          <webdmx-icon name="options"></webdmx-icon>
        </button>
        <button aria-label="Remove device from universe" @click="${this.handleRemoveClick}">
          <webdmx-icon name="trash"></webdmx-icon>
        </button>
      </nav>

      <section>
        <span>${this.#devices?.[this.deviceIndex!]?.preset}</span>
        <span>${this.#devices?.[this.deviceIndex!]?.profile}</span>
        <span>${this.#devices?.[this.deviceIndex!]?.address}</span>
      </section>

      <webdmx-popup
        aria-expanded="${String(this.parameterEditorVisible) as 'true' | 'false'}"
        .hidden="${!this.parameterEditorVisible}"
        @webdmx-popup:hidden="${this.handleParametersHidden}"
      >
        <webdmx-device-parameter-editor
          .deviceData="${this.#devices?.[this.deviceIndex!]}"
          .reservedAddresses="${this.reservedAddresses}"
          @webdmx-device-parameter-editor:change="${this.handleParametersChange}"
        ></webdmx-device-parameter-editor>
      </webdmx-popup>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-device-editor:remove': DeviceEditorRemoveEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-editor': DeviceEditor;
  }
}
