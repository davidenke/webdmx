import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import styles from './device-preview.component.scss?inline';

/**
 * @element webdmx-device-preview
 */
@customElement('webdmx-device-preview')
export class DevicePreview extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  /**
   * The device to be previewed.
   */
  @property({ type: Object, attribute: false })
  set device(device: Partial<DeviceData> | undefined) {
    this.style.setProperty('--webdmx-device-preview-x', device?.position?.x ? `${device.position?.x}px` : '50%');
    this.style.setProperty('--webdmx-device-preview-y', device?.position?.y ? `${device.position?.y}px` : '50%');
  }

  /**
   * Selects the device.
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  override render(): TemplateResult {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-device-preview': DevicePreview;
  }
}
