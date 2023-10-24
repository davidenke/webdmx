import type * as Icons from 'css.gg/icons/icons.json';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { when } from 'lit/directives/when.js';

import styles from './icon.component.scss?inline';

/**
 * The typed name of an icon. Resolved from the
 * exported json of the css.gg icon set.
 */
export type IconName = keyof typeof Icons;

/**
 * @element webdmx-icon
 */
@customElement('webdmx-icon')
export class Icon extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #name?: IconName;

  @state()
  private icon?: string;

  /**
   * The icon name.
   */
  @property({ type: String, reflect: true, noAccessor: true })
  set name(name: IconName | undefined) {
    if (name !== this.#name) {
      this.#name = name;
      this.#resolveIcon(this.#name);
    }
  }
  get name(): IconName | undefined {
    return this.#name;
  }

  async #resolveIcon(name?: IconName): Promise<void> {
    if (name === undefined) {
      this.icon = undefined;
      return;
    }

    const icon = await import(`../../../../node_modules/css.gg/icons/svg/${name}.svg?raw`);
    this.icon = icon.default;
  }

  override render(): TemplateResult {
    return html`${when(this.icon !== undefined, () => html`${unsafeHTML(this.icon)}`)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'webdmx-icon': Icon;
  }
}
