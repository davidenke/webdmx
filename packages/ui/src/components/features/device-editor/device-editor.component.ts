import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { isSameOrWithin } from '../../../utils/dom.utils.js';
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

  #handleClickOutside = this.handleClickOutside.bind(this);

  @property({ type: Boolean, reflect: true, attribute: 'parameter-editor-visible' })
  parameterEditorVisible = false;

  @property({ type: Boolean, reflect: true, attribute: 'dragging' })
  dragging = false;

  @property({ type: Object, attribute: false, noAccessor: true })
  deviceData?: Readonly<Partial<DeviceData>> | undefined;

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
        <span>${this.deviceData?.preset}</span>
        <span>${this.deviceData?.profile}</span>
        <span>${this.deviceData?.address}</span>
      </section>

      <webdmx-popup
        aria-expanded="${String(this.parameterEditorVisible) as 'true' | 'false'}"
        .hidden="${!this.parameterEditorVisible}"
        @webdmx-popup:hidden="${this.handleParametersHidden}"
      >
        <webdmx-device-parameter-editor
          .deviceData="${this.deviceData}"
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
