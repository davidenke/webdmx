import type { Channels, Slider } from '@webdmx/common';
import type { PresetName } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';
import { use } from 'lit-shared-state';

import type { UniverseConfig } from '../../../state/config.state.js';
import { presets } from '../../../state/presets.state.js';
import styles from './preview.component.scss?inline';

export type PreviewUpdateEvent = CustomEvent<{ name: string; channels: Channels }>;

/**
 * @element webdmx-preview
 */
@customElement('webdmx-preview')
export class Preview extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #universe?: Readonly<UniverseConfig>;

  @use() private presets = presets;

  @property({ type: Object, attribute: false, noAccessor: true })
  set universe(universe: Readonly<UniverseConfig> | undefined) {
    // update internal state
    this.#universe = universe;

    // update presets with detailed information
    const names = this.#universe?.devices.map(({ preset }) => preset) ?? [];
    this.presets.loadPreset(...names).then(() => this.requestUpdate('universe'));
  }

  @property({ type: Boolean, reflect: true })
  connected: boolean = false;

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

          ${when(
            device.preset !== undefined && device.profile !== undefined,
            () =>
              this.presets[device.preset as PresetName]?.profiles?.[device.profile!]?.channels?.map(
                (channel, index) =>
                  html` ${choose(this.presets[device.preset as PresetName]?.controls?.[channel]?.type, [
                    [
                      'slider',
                      () =>
                        this.#renderRange(
                          this.presets[device.preset as PresetName]?.controls?.[channel] as Slider,
                          (device.address ?? 1) - 1 + index,
                        ),
                    ],
                  ])}`,
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
