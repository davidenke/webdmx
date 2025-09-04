import type { Channels, Options, Slider } from '@webdmx/common';
import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import type { CombinedControls } from '../../../utils/device.utils.js';
import { getCombinedControls } from '../../../utils/device.utils.js';
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
  private presets = presets;

  @state()
  private uniqueControls: CombinedControls = new Map();

  @property({ type: Boolean, reflect: true })
  readonly connected = false;

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
    this.presets.load(...names).then(() => {
      this.uniqueControls = getCombinedControls(this.#devices, this.presets);
      this.requestUpdate('uniqueControls');
    });
  }

  @eventOptions({ passive: true })
  private updateRangeInput(event: InputEvent) {
    const { dataset, valueAsNumber } = event.target as HTMLInputElement;
    // pick corresponding device
    const channels =
      dataset.channels?.split(',').reduce((channels, channel) => {
        return { ...channels, [parseInt(channel)]: valueAsNumber };
      }, {} as Channels) ?? {};
    this.#emitUpdateEvent(channels);
  }

  // @eventOptions({ passive: true })
  // private updateOptionsInput(event: InputEvent) {
  //   console.log(event);
  // }

  #emitUpdateEvent(channels: Channels) {
    const event = new CustomEvent('webdmx-device-channels-preview:update', { detail: channels, bubbles: true });
    this.dispatchEvent(event);
  }

  #renderRange(control: Slider, channels: number[], value: number): TemplateResult {
    return html`
      <label>
        ${control.label}
        <input
          type="range"
          min="${control.from}"
          max="${control.to}"
          step="${control.step}"
          data-channels="${channels.join(',')}"
          ?disabled="${!this.connected}"
          .valueAsNumber="${value}"
          @input="${this.updateRangeInput}"
        />
      </label>
    `;
  }

  #renderOptions(control: Options, channels: number[]): TemplateResult {
    return html`
      <label>
        ${control.options.map(({ label }) => label).join(', ')}
        <pre>channels: ${channels}</pre>
      </label>
    `;
  }

  override render(): TemplateResult {
    return html`
      ${repeat(
        this.uniqueControls,
        ([key]) => key,
        ([, { control, channels }]) => html`
          ${choose(control.type, [
            ['slider', () => this.#renderRange(control as Slider, channels, 0)],
            ['options', () => this.#renderOptions(control as Options, channels)],
          ])}
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
