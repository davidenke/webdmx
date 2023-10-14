import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';

import styles from './preview.component.scss?inline';

/**
 * @element webdmx-preview
 */
@customElement('webdmx-preview')
export class Preview extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  override render(): TemplateResult {
    return html`<span>Preview</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-preview': Preview;
  }
}
