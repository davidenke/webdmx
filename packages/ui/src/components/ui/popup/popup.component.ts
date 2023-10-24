import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import styles from './popup.component.scss?inline';
import { hideOtherPopupsThan, registerPopup, unregisterPopup } from './popup.utils.js';

export type PopupHiddenEvent = CustomEvent<boolean>;

/**
 * @element webdmx-popup
 *
 * @slot - The content to display inside the popup.
 */
@customElement('webdmx-popup')
export class Popup extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #hidden = true;

  /**
   * The visibility state of the popup.
   */
  @property({ type: Boolean, reflect: true, noAccessor: true })
  override set hidden(hidden: boolean) {
    const wasHidden = this.#hidden;
    this.#hidden = hidden;
    if (!this.#hidden) hideOtherPopupsThan(this);
    if (wasHidden !== this.#hidden) this.#emitHiddenEvent();
    this.requestUpdate('hidden', wasHidden);
  }
  override get hidden(): boolean {
    return this.#hidden;
  }

  /**
   * The position of the popup.
   */
  @property({ type: String, reflect: true })
  position: 'top' | 'right' | 'bottom' | 'left' = 'bottom';

  #emitHiddenEvent() {
    const detail = this.#hidden;
    const event = new CustomEvent('webdmx-popup:hidden', { detail }) satisfies PopupHiddenEvent;
    this.dispatchEvent(event);
  }

  override connectedCallback() {
    super.connectedCallback();
    registerPopup(this);
  }

  override disconnectedCallback() {
    unregisterPopup(this);
    super.disconnectedCallback();
  }

  override render(): TemplateResult {
    return html`${when(!this.#hidden, () => html`<slot></slot>`)}`;
  }
}

declare global {
  interface HTMLElementEventMap {
    'webdmx-popup:hidden': PopupHiddenEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-popup': Popup;
  }
}
