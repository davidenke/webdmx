import type { Channels, Preset, Slider } from '@webdmx/common';
import { DMX } from '@webdmx/controller';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import type { UniverseData } from '../../../utils/data.utils.js';
import { loadPreset } from '../../../utils/preset.utils.js';
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
  presets: Record<string, Preset | null> = Object.fromEntries(DMX.presetNames.map((name) => [name, null]));

  @property({ type: Boolean, reflect: true })
  connected: boolean = false;

  @property({ type: Object, attribute: false, noAccessor: true })
  set universe(universe: Readonly<UniverseData> | undefined) {
    // update internal state
    this.#universe = universe;

    // update presets with detailed information
    const names = this.#universe?.devices.map(({ preset }) => preset) ?? [];
    loadPreset(this.presets, ...names).then((presets) => {
      this.presets = presets;
      this.requestUpdate();
    });
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
    const event = new CustomEvent('webdmx-preview:update', { detail });
    this.dispatchEvent(event);
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
              this.presets[device.preset!]?.profiles?.[device.profile!]?.channels?.map(
                (channel, index) =>
                  html` ${choose(this.presets[device.preset!]?.controls?.[channel]?.type, [
                    [
                      'slider',
                      () =>
                        this.#renderRange(
                          this.presets[device.preset!]?.controls?.[channel] as Slider,
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
