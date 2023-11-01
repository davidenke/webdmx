import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';

import type { DeviceData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import styles from './address-editor.component.scss?inline';

// every address is either a regular address or a device address,
// but both consist of a label and a length
type EmptyAddressData = {
  label: string;
  length: number;
};

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

export type AddressEditorChangeEvent = CustomEvent<Partial<DeviceData>[]>;

/**
 * @element webdmx-address-editor
 */
@customElement('webdmx-address-editor')
export class AddressEditor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #addressData: Addresses = new Map();
  #deviceData: DeviceAddressData[] = [];
  #devices: Partial<DeviceData>[] = [];

  #draggedAddressOffset?: number;
  #draggedElement?: HTMLElement;
  #draggedGhostElement?: HTMLElement;

  @state()
  presets = presets;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number, reflect: true })
  first = 1;

  @property({ type: Number, reflect: true })
  length = 512;

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
    // set drag type
    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
    event.dataTransfer!.effectAllowed = 'move';

    // set invisible ghost image (must not have display: none!)
    // https://www.kryogenix.org/code/browser/custom-drag-image.html
    this.#draggedGhostElement = document.createElement('canvas');
    this.#draggedGhostElement.style.opacity = '0';
    this.#draggedGhostElement.style.position = 'absolute';
    this.#draggedGhostElement.style.zIndex = '-10';
    document.body.appendChild(this.#draggedGhostElement);
    event.dataTransfer!.setDragImage(this.#draggedGhostElement, 0, 0);

    // store dragged element reference
    this.#draggedElement = event.target as HTMLElement;

    // derive and store address offset
    const address = parseInt(this.#draggedElement.dataset!.address!);
    const deviceIndex = parseInt(this.#draggedElement.dataset!.deviceIndex!);
    this.#draggedAddressOffset = address - this.#devices[deviceIndex!].address!;
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
    // prevent default behavior to enable drop event
    event.preventDefault();

    // retrieve element references and check if they are the same
    const target = event.currentTarget as HTMLElement;
    if (target.isSameNode(this.#draggedElement ?? null)) return;

    // retrieve data from element references
    const address = parseInt(target.dataset!.address!);
    const deviceLength = parseInt(this.#draggedElement!.dataset.deviceLength!);
    const deviceIndex = parseInt(this.#draggedElement!.dataset.deviceIndex!);

    // prevent dragging on existing device, so we need to know all
    // new addresses of the device that will be targeted
    const newAddress = address - this.#draggedAddressOffset!;

    // first of all, limit the new address to the range of the editor
    if (newAddress < this.first) return;
    if (newAddress + deviceLength - 1 > this.length) return;

    // now we need to know the reserved addresses of all other devices
    // to check if the dragged device would overlap with any of them
    const reservedAddresses = this.#devices.reduce((addresses, { address }, index) => {
      if (index === deviceIndex) return addresses;
      const length = this.#deviceData[index].length;
      return addresses.concat(Array.from({ length }, (_, i) => address! + i));
    }, [] as number[]);

    // now check for intersections and if so, skip the drop event
    const newAddresses = Array.from({ length: deviceLength }, (_, i) => newAddress + i);
    const isIntersecting = newAddresses.some((address) => reservedAddresses.includes(address));
    if (isIntersecting) return;

    // update corresponding device address
    const devices = this.#devices.slice();
    devices[deviceIndex].address = newAddress;

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

  #deriveAddresses() {
    // prepare address data for rendering
    const addressData: Addresses = new Map();
    for (let address = this.first; address <= this.length; ) {
      const deviceIndex = this.#devices.findIndex((device) => device.address === address);
      const label = `${address}`.padStart(3, '0');
      // a regular address entry
      if (deviceIndex < 0) {
        addressData.set(address, { label, length: 1 });
        ++address;
        continue;
      }

      // a device entry, spread over multiple addresses
      const device = this.#devices[deviceIndex];
      const { length } = this.presets.getChannels(device.preset, device.profile);
      for (let i = 0; i < length; ++i) {
        const deviceData: Partial<DeviceAddressData> = { deviceIndex, device, length, label };
        if (i === 0) deviceData.isDeviceBegin = true;
        if (i === length - 1) deviceData.isDeviceEnd = true;
        addressData.set(address, deviceData as DeviceAddressData);
        this.#deviceData.push(deviceData as DeviceAddressData);
        ++address;
      }
    }
    this.#addressData = addressData;
  }

  #emitChangeEvent(devices: Partial<DeviceData>[]) {
    const options = { detail: devices, bubbles: true, composed: true };
    const event = new CustomEvent('webdmx-address-editor:change', options);
    this.dispatchEvent(event);
  }

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

  protected renderDeviceAddress(
    address: number,
    { device, deviceIndex, label, length, isDeviceBegin, isDeviceEnd }: DeviceAddressData,
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
        data-device-index="${deviceIndex!}"
        data-device-length="${length!}"
        @dragstart="${this.handleDragStart}"
        @dragover="${this.handleDragOver}"
        @dragenter="${this.handleDragEnter}"
        @drop="${this.handleDrop}"
      >
        <span>${label} ${device!.preset} (${device!.profile})</span>
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
              () => this.renderEmptyAddress(address, device as EmptyAddressData),
            )}
          `,
        )}
      </section>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-address-editor:change': AddressEditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-address-editor': AddressEditor;
  }
}
