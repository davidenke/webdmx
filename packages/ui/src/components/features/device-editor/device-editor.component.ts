import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import styles from './device-editor.component.scss?inline';

export type DeviceEditorChangeEvent = CustomEvent<Partial<DeviceData>>;
export type DeviceEditorRemoveEvent = CustomEvent<void>;

/**
 * @element webdmx-device-editor
 */
@customElement('webdmx-device-editor')
export class DeviceEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  @property({ type: Boolean, reflect: true, attribute: 'parameter-editor-visible' })
  parameterEditorVisible = false;

  @property({ type: Object, attribute: false, noAccessor: true })
  readonly deviceData?: Readonly<Partial<DeviceData>> | undefined;

  @eventOptions({ passive: true })
  private handleParametersClick() {
    this.parameterEditorVisible = !this.parameterEditorVisible;
  }

  override render(): TemplateResult {
    return html`
      <button @click="${this.handleParametersClick}">Parameters</button>

      <webdmx-popup ?visible="${this.parameterEditorVisible}">
        <webdmx-device-parameter-editor .deviceData="${this.deviceData}"></webdmx-device-parameter-editor>
      </webdmx-popup>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-device-editor:change': DeviceEditorChangeEvent;
    'webdmx-device-editor:remove': DeviceEditorRemoveEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-editor': DeviceEditor;
  }
}
