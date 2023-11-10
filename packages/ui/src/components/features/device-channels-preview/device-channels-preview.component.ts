import type { Channels, Slider } from '@webdmx/common';
import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import styles from './device-channels-preview.component.scss?inline';

export type DeviceChannelsPreviewUpdateEvent = CustomEvent<Channels>;

/**
 * @element webdmx-device-channels-preview
 */
@customElement('webdmx-device-channels-preview')
export class DeviceChannelsPreview extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #devices: Partial<DeviceData>[] = [];

  @state()
  presets = presets;

  @property({ type: Boolean, reflect: true })
  connected: boolean = false;

  /**
   * The devices which channels will be used.
   * Multiple devices will show combined channel controls.
   */
  @property({ type: Array, attribute: false, noAccessor: true })
  set devices(devices: Partial<DeviceData>[] | undefined) {
    // update internal state
    this.#devices = devices ?? [];
    // update presets with detailed information
    const names = this.#devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => this.requestUpdate());
  }

  @eventOptions({ passive: true })
  private updateRangeInput(event: InputEvent) {
    const { dataset, valueAsNumber } = event.target as HTMLInputElement;
    // pick corresponding device
    const { channel } = dataset;
    this.#emitUpdateEvent({ [parseInt(channel!)]: valueAsNumber });
  }

  #emitUpdateEvent(channels: Channels) {
    this.dispatchEvent(new CustomEvent('webdmx-device-channels-preview:update', { detail: channels, bubbles: true }));
  }

  #renderRange(control: Slider, channel: number, value: number): TemplateResult {
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
          .valueAsNumber="${value}"
          @input="${this.updateRangeInput}"
        />
      </label>
    `;
  }

  override render(): TemplateResult {
    return html`
      ${map(
        this.#devices ?? [],
        (device) => html`
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
                          0,
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
    'webdmx-device-channels-preview:update': DeviceChannelsPreviewUpdateEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-device-channels-preview': DeviceChannelsPreview;
  }
}
