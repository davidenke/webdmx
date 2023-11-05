import type { Channels, Slider } from '@webdmx/common';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import type { UniverseData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import styles from './preview.component.scss?inline';

export type PreviewUpdateEvent = CustomEvent<{ name: string; channels: Channels }>;

/**
 * @element webdmx-preview
 */
@customElement('webdmx-preview')
export class Preview extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #universe?: Readonly<UniverseData>;

  @state()
  presets = presets;

  @property({ type: Boolean, reflect: true })
  connected: boolean = false;

  @property({ type: Object, attribute: false, noAccessor: true })
  set universe(universe: Readonly<UniverseData> | undefined) {
    // update internal state
    const oldUniverse = this.#universe;
    this.#universe = universe;

    // update presets with detailed information
    const names = this.#universe?.devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => this.requestUpdate('universe', oldUniverse));
  }

  @eventOptions({ passive: true })
  private updateRangeInput(event: InputEvent) {
    const { dataset, valueAsNumber } = event.target as HTMLInputElement;
    // pick corresponding device
    const name = this.#universe?.label ?? 'default';
    const { channel } = dataset;
    this.#emitUpdateEvent(name, { [parseInt(channel!)]: valueAsNumber });
  }

  #emitUpdateEvent(name: string, channels: Channels) {
    const detail = { name, channels } satisfies PreviewUpdateEvent['detail'];
    this.dispatchEvent(new CustomEvent('webdmx-preview:update', { detail, bubbles: true }));
  }

  #renderRange(control: Slider, channel: number): TemplateResult {
    return html`
      <label>
        ${control.label}
        <input
          type="range"
          min="${control.from}"
          max="${control.to}"
          step="${control.step}"
          data-channel="${channel}"
          ?disabled="${!this.connected}"
          .valueAsNumber="${0}"
          @input="${this.updateRangeInput}"
        />
      </label>
    `;
  }

  override render(): TemplateResult {
    return html`
      ${map(
        this.#universe?.devices ?? [],
        (device) => html`
          <h2>${device.preset}</h2>
          <h3>${device.profile}</h3>
          <p>${device.address}</p>

          ${when(device.preset !== undefined && device.profile !== undefined, () =>
            this.presets
              .getChannels(device.preset, device.profile)
              .map(
                (channel, index) => html`
                  ${choose(this.presets.getControl(device.preset, channel)?.type, [
                    [
                      'slider',
                      () =>
                        this.#renderRange(
                          this.presets.getControl<Slider>(device.preset, channel)!,
                          (device.address ?? 1) - 1 + index,
                        ),
                    ],
                  ])}
                `,
              ),
          )}
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-preview:update': PreviewUpdateEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-preview': Preview;
  }
}
