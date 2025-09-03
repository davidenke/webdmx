import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';

import styles from './switch.component.scss?inline';

/**
 * @element webdmx-switch
 *
 * @slot on - The content to display when the switch is active.
 * @slot off - The content to display when the switch is inactive.
 */
@customElement('webdmx-switch')
export class Switch extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  /**
   * Sets the switch to a disabled state.
   */
  @property({ type: Boolean, reflect: true })
  readonly disabled = false;

  /**
   * Initialize in active state.
   */
  @property({ type: Boolean, reflect: true })
  active = false;

  @eventOptions({ passive: true })
  private handleInput() {
    this.active = !this.active;
    this.dispatchEvent(new CustomEvent('webdmx-switch:toggle', { detail: this.active, bubbles: true, composed: true }));
  }

  override render(): TemplateResult {
    return html`
      <label>
        <input type="checkbox" ?checked="${this.active}" ?disabled="${this.disabled}" @input="${this.handleInput}" />
        <slot name="off" aria-hidden="${this.active}"></slot>
        <slot name="on" aria-hidden="${this.active}"></slot>
      </label>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-switch:toggle': CustomEvent<boolean>;
  }

  interface HTMLElementTagNameMap {
    'webdmx-switch': Switch;
  }
}
