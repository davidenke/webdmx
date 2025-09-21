import type { EventWithTarget } from '@enke.dev/lit-utils/lib/types/event.types.js';
import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { getReservedAddresses } from '../../../utils/device.utils.js';
import { presets } from '../../../utils/preset.utils.js';

import styles from './address-editor.component.scss?inline';

// every address is either a regular address or a device address,
// but both consist of a label and a length
interface EmptyAddressData {
  label: string;
  length: number;
}

// a device address has additional information to the empty address
type DeviceAddressData = EmptyAddressData & {
  deviceIndex: number;
  device: Partial<DeviceData>;
  isDeviceBegin: true;
  isDeviceEnd: true;
};

// all stored addresses are keyed by their address number and contain
// either an empty address or an address with device information
type Addresses = Map<number, EmptyAddressData | DeviceAddressData>;

/**
 * The change event of the address editor. Will contain the
 * new device data of all devices.
 */
export type AddressEditorInteractiveEvent = CustomEvent<number | undefined>;
export type AddressEditorChangeEvent = CustomEvent<Partial<DeviceData>[]>;

/**
 * @element webdmx-address-editor
 *
 * @cssprop --webdmx-address-editor-item-gap - The gap between address items.
 * @cssprop --webdmx-address-editor-item-radius - The border radius of address items.
 * @cssprop --webdmx-address-editor-item-width - The width of address items.
 * @cssprop --webdmx-address-editor-item-spacing-horizontal - The horizontal spacing of address items.
 * @cssprop --webdmx-address-editor-item-spacing-vertical - The vertical spacing of address items.
 *
 * @emits webdmx-address-editor:interactive - Emitted when an device is interacted with.
 * @emits webdmx-address-editor:change - Emitted when an address has been changed.
 */
@customElement('webdmx-address-editor')
export class AddressEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #addressData: Addresses = new Map();
  #devices: Partial<DeviceData>[] = [];

  #draggedAddressOffset?: number;
  #draggedElement?: HTMLElement;
  #draggedGhostElement?: HTMLElement;

  @state()
  private presets = presets;

  /**
   * Disables the address editor.
   */
  @property({ type: Boolean, reflect: true })
  readonly disabled = false;

  /**
   * The first address of the editor.
   */
  @property({ type: Number, reflect: true })
  readonly first = 1;

  /**
   * The overall length of the editor.
   */
  @property({ type: Number, reflect: true })
  readonly length = 512;

  /**
   * The maybe currently interactive device.
   */
  @property({ type: Number, reflect: true, attribute: 'interactive-device' })
  readonly interactiveDevice?: number;

  /**
   * The devices to be rendered. Consists of partial device data.
   */
  @property({ type: Array, attribute: false, noAccessor: true })
  set devices(devices: Partial<DeviceData>[] | undefined) {
    // update internal state
    this.#devices = devices ?? [];
    // update presets with detailed information
    const names = this.#devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => {
      // prepare address / device data for rendering
      this.#deriveAddresses();
      // render again
      this.requestUpdate();
    });
  }

  @eventOptions({ passive: true })
  private handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) {
      return;
    }

    // set drag type
    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
    event.dataTransfer.effectAllowed = 'move';

    // set invisible ghost image (must not have display: none!)
    // https://www.kryogenix.org/code/browser/custom-drag-image.html
    this.#draggedGhostElement = document.createElement('canvas');
    this.#draggedGhostElement.style.opacity = '0';
    this.#draggedGhostElement.style.position = 'absolute';
    this.#draggedGhostElement.style.zIndex = '-10';
    document.body.appendChild(this.#draggedGhostElement);
    event.dataTransfer.setDragImage(this.#draggedGhostElement, 0, 0);

    // store dragged element reference
    this.#draggedElement = event.target as HTMLElement;

    // derive and store address offset
    const { address, deviceIndex } = this.#draggedElement.dataset;
    if (address === undefined || deviceIndex === undefined) {
      return;
    }
    const parsedAddress = parseInt(address);
    const parsedDeviceIndex = parseInt(deviceIndex);
    this.#draggedAddressOffset = parsedAddress - (this.#devices[parsedDeviceIndex]?.address ?? 0);
  }

  @eventOptions({ capture: true })
  private handleDragOver(event: DragEvent) {
    // prevent default behavior to enable drop event
    // https://stackoverflow.com/a/21341021/1146207
    // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#performing_a_drop
    event.preventDefault();
  }

  @eventOptions({ capture: true })
  private handleDragEnter(event: DragEvent) {
    if (this.#draggedElement === undefined) {
      return;
    }

    // prevent default behavior to enable drop event
    event.preventDefault();

    // retrieve element references and check if they are the same
    const target = event.currentTarget as HTMLElement;
    if (target.isSameNode(this.#draggedElement)) {
      return;
    }

    // retrieve data from element references
    const { address } = target.dataset;
    const { deviceIndex, deviceLength } = this.#draggedElement.dataset;
    if (address === undefined || deviceIndex === undefined || deviceLength === undefined) {
      return;
    }
    const targetAddress = parseInt(address);
    const parsedDeviceIndex = parseInt(deviceIndex);
    const parsedDeviceLength = parseInt(deviceLength);

    // prevent dragging on existing device, so we need to know all
    // new addresses of the device that will be targeted
    const newAddress = targetAddress - (this.#draggedAddressOffset ?? 0);

    // first of all, limit the new address to the range of the editor
    if (newAddress < this.first) {
      return;
    }
    if (newAddress + parsedDeviceLength - 1 > this.length) {
      return;
    }

    // now we need to know the reserved addresses of all other devices
    // to check if the dragged device would overlap with any of them
    const reservedAddresses = getReservedAddresses(this.#devices, this.presets, [
      parsedDeviceIndex,
    ]);

    // now check for intersections and if so, skip the drop event
    const newAddresses = Array.from({ length: parsedDeviceLength }, (_, i) => newAddress + i);
    const isIntersecting = newAddresses.some(address => reservedAddresses.includes(address));
    if (isIntersecting) {
      return;
    }

    // update corresponding device address
    const devices = this.#devices.slice();
    devices[parsedDeviceIndex].address = newAddress;

    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ capture: true })
  private async handleDrop(event: DragEvent) {
    // do not handle drop event
    event.preventDefault();

    // finish dragging and reset element reference
    this.#draggedElement = undefined;
    this.#draggedAddressOffset = undefined;

    // reset ghost element
    if (this.#draggedGhostElement !== undefined) {
      document.body.removeChild(this.#draggedGhostElement);
      this.#draggedGhostElement = undefined;
    }
  }

  @eventOptions({ passive: true })
  private handleDeviceMouseEnter(event: EventWithTarget<HTMLElement>) {
    const { deviceIndex } = event.target.dataset;
    this.#emitInteractiveEvent(deviceIndex !== undefined ? parseInt(deviceIndex) : undefined);
  }

  @eventOptions({ passive: true })
  private handleDeviceMouseLeave() {
    this.#emitInteractiveEvent(undefined);
  }

  #deriveAddresses() {
    // prepare address data for rendering
    const addressData: Addresses = new Map();
    for (let address = this.first; address <= this.length; ) {
      const deviceIndex = this.#devices.findIndex(device => device.address === address);
      const label = `${address}`.padStart(3, '0');
      // a regular address entry
      if (deviceIndex < 0) {
        addressData.set(address, { label, length: 1 });
        ++address;
        continue;
      }

      // a device entry, spread over multiple addresses
      const device = this.#devices[deviceIndex];
      if (device.preset === undefined || device.profile === undefined) {
        continue;
      }
      const { length } = this.presets.getChannels(device.preset, device.profile);
      for (let i = 0; i < length; ++i) {
        const deviceAddressData: Partial<DeviceAddressData> = {
          deviceIndex,
          device,
          length,
          label,
        };
        if (i === 0) {
          deviceAddressData.isDeviceBegin = true;
        }
        if (i === length - 1) {
          deviceAddressData.isDeviceEnd = true;
        }
        addressData.set(address, deviceAddressData as DeviceAddressData);
        ++address;
      }
    }
    this.#addressData = addressData;
  }

  #emitInteractiveEvent(deviceIndex: number | undefined) {
    const options = { detail: deviceIndex, bubbles: true, composed: true };
    const event = new CustomEvent('webdmx-address-editor:interactive', options);
    this.dispatchEvent(event);
  }

  #emitChangeEvent(devices: Partial<DeviceData>[]) {
    const options = { detail: devices, bubbles: true, composed: true };
    const event = new CustomEvent('webdmx-address-editor:change', options);
    this.dispatchEvent(event);
  }

  /**
   * Renders an empty address span element.
   * @param address The address of the empty space.
   * @param data The empty address data.
   * @returns A TemplateResult representing the empty address span.
   */
  protected renderEmptyAddress(address: number, { label }: EmptyAddressData): TemplateResult {
    return html`
      <span
        class="address"
        data-address="${address}"
        @dragover="${this.handleDragOver}"
        @dragenter="${this.handleDragEnter}"
        @drop="${this.handleDrop}"
        >${label}</span
      >
    `;
  }

  /**
   * Renders a device address span element.
   * @param address The address of the device, must be between 1 and 512.
   * @param data The device address data
   * @returns A TemplateResult representing the device address span.
   */
  protected renderDeviceAddress(
    address: number,
    { device, deviceIndex, label, length, isDeviceBegin, isDeviceEnd }: DeviceAddressData
  ): TemplateResult {
    return html`
      <span
        class="${classMap({
          device: true,
          'device-begin': isDeviceBegin,
          'device-end': isDeviceEnd,
        })}"
        draggable="true"
        data-address="${address}"
        data-device-index="${deviceIndex}"
        data-device-length="${length}"
        data-interactive="${ifDefined(this.interactiveDevice === deviceIndex ? 'true' : undefined)}"
        @dragstart="${this.handleDragStart}"
        @dragover="${this.handleDragOver}"
        @dragenter="${this.handleDragEnter}"
        @drop="${this.handleDrop}"
        @mouseenter="${this.handleDeviceMouseEnter}"
        @mouseleave="${this.handleDeviceMouseLeave}"
        style="---webdmx-address-editor-device-offset: ${(device.address ?? 1) - address + 1}"
      >
        ${when(
          isDeviceBegin,
          () => html`<span>${label}</span>`,
          () => html`<span>${device.preset} (${device.profile})</span>`
        )}
      </span>
    `;
  }

  override render(): TemplateResult {
    return html`
      <section>
        ${repeat(
          this.#addressData,
          ([address]) => address,
          ([address, device]) => html`
            ${when(
              'device' in device,
              () => this.renderDeviceAddress(address, device as DeviceAddressData),
              () => this.renderEmptyAddress(address, device as EmptyAddressData)
            )}
          `
        )}
      </section>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-address-editor:interactive': AddressEditorInteractiveEvent;
    'webdmx-address-editor:change': AddressEditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-address-editor': AddressEditor;
  }
}
