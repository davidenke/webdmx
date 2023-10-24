import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import styles from './popup.component.scss?inline';

/**
 * @element webdmx-popup
 *
 * @slot - The content to display inside the popup.
 */
@customElement('webdmx-popup')
export class Popup extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  /**
   * The visibility state of the popup.
   */
  @property({ type: Boolean, reflect: true })
  readonly visible = false;

  /**
   * The position of the popup.
   */
  @property({ type: String, reflect: true })
  position: 'top' | 'right' | 'bottom' | 'left' = 'bottom';

  override render(): TemplateResult {
    return html`${when(this.visible, () => html`<slot></slot>`)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-popup': Popup;
  }
}
