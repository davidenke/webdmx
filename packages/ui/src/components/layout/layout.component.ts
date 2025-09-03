import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';

import styles from './layout.component.scss?inline';

/**
 * @element webdmx-layout
 */
@customElement('webdmx-layout')
export class Layout extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  override render(): TemplateResult {
    return html`
      <slot name="header"></slot>
      <slot></slot>
      <slot name="footer"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-layout': Layout;
  }
}
