import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './layout.component.scss?inline';

/**
 * @element webdmx-layout
 */
@customElement('webdmx-layout')
export class Layout extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  /**
   * Whether the layout is in edit or preview mode.
   * - The edit mode allows to add, remove and position the universe items.
   * - The preview mode shows the universe and allows controlling it.
   */
  @property({ type: String, reflect: true })
  readonly mode: 'edit' | 'preview' = 'preview';

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
