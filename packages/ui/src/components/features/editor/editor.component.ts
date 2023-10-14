import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';

import styles from './editor.component.scss?inline';

/**
 * @element webdmx-editor
 */
@customElement('webdmx-editor')
export class Editor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  override render(): TemplateResult {
    return html`<span>Editor</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-editor': Editor;
  }
}
