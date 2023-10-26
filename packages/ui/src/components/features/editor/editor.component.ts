import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DeviceData, UniverseData } from '../../../utils/data.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import { DeviceEditor, type DeviceEditorChangeEvent } from '../device-editor/device-editor.component.js';
import styles from './editor.component.scss?inline';
import { prepareDeviceDrag, processDeviceDrop } from './editor.utils.js';

export type EditorChangeEvent = CustomEvent<Partial<DeviceData>[]>;

/**
 * @element webdmx-editor
 */
@customElement('webdmx-editor')
export class Editor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #universe?: Readonly<UniverseData>;

  @state()
  presets = presets;

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
  private async handleDeviceChange({ detail, target }: DeviceEditorChangeEvent) {
    // read the selected index and data
    const { dataset } = target as DeviceEditor;
    const index = parseInt(dataset.deviceIndex!);
    // update corresponding device
    const devices = this.#universe?.devices?.slice() ?? [];
    devices[index] = { ...this.#universe?.devices?.[index], ...detail };
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ passive: true })
  private async handleDeviceRemove({ target }: CustomEvent<void>) {
    // read the selected index
    const { dataset } = target as DeviceEditor;
    const index = parseInt(dataset.deviceIndex!);
    // update corresponding device
    const devices = this.#universe?.devices?.slice() ?? [];
    devices.splice(index, 1);
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ passive: true })
  private async handleAddDeviceClick() {
    // update corresponding device
    const devices = [...(this.#universe?.devices ?? []), {}];
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ passive: true })
  private handleDragStart(event: DragEvent) {
    // prevent event from bubbling up
    event.stopPropagation();

    // prepare drag event and retrieve element reference
    const deviceElement = prepareDeviceDrag(event);

    // close the parameter editor popup and set dragging state
    deviceElement.dragging = true;
    deviceElement.parameterEditorVisible = false;
  }

  @eventOptions({ capture: true })
  private handleDragging(event: DragEvent) {
    // cancel default behavior to allow drop by preventing
    // the dragenter, dragover and dragleave events
    // https://stackoverflow.com/a/21341021/1146207
    // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#performing_a_drop
    event.preventDefault();
  }

  @eventOptions({ passive: true })
  private async handleDrop(event: DragEvent) {
    // process drop event and retrieve element reference
    const { deviceElement, deviceIndex, position } = processDeviceDrop(event, false);
    deviceElement.dragging = false;

    // update corresponding device position
    const devices = this.#universe?.devices?.slice() ?? [];
    devices[deviceIndex] = { ...this.#universe?.devices?.[deviceIndex], position };

    // emit the change event
    this.#emitChangeEvent(devices);
  }

  #emitChangeEvent(devices: Partial<DeviceData>[]) {
    const event = new CustomEvent('webdmx-editor:change', { detail: devices, bubbles: true, composed: true });
    this.dispatchEvent(event);
  }

  constructor() {
    super();
    this.addEventListener('drop', this.handleDrop, false);
    this.addEventListener('dragenter', this.handleDragging, false);
    this.addEventListener('dragleave', this.handleDragging, false);
    this.addEventListener('dragover', this.handleDragging, false);
  }

  override disconnectedCallback() {
    this.removeEventListener('drop', this.handleDrop, false);
    this.removeEventListener('dragenter', this.handleDragging, false);
    this.removeEventListener('dragleave', this.handleDragging, false);
    this.removeEventListener('dragover', this.handleDragging, false);
    super.disconnectedCallback();
  }

  override render(): TemplateResult {
    return html`
      ${map(
        this.#universe?.devices ?? [],
        (device, index) => html`
          <webdmx-device-editor
            draggable="true"
            data-device-index="${index}"
            ?autofocus="${index === 0}"
            .deviceData="${device}"
            @dragstart="${this.handleDragStart}"
            @webdmx-device-parameter-editor:change="${this.handleDeviceChange}"
            @webdmx-device-editor:remove="${this.handleDeviceRemove}"
            style="${styleMap({
              '--webdmx-device-editor-x': device.position?.x ? `${device.position?.x}px` : '50%',
              '--webdmx-device-editor-y': device.position?.y ? `${device.position?.y}px` : '50%',
            })}"
          ></webdmx-device-editor>
        `,
      )}

      <button aria-label="Add device" @click="${this.handleAddDeviceClick}">
        <webdmx-icon name="add"></webdmx-icon>
      </button>
    `;
  }
}

declare global {
  interface HTMLEventMap {
    'webdmx-editor:change': EditorChangeEvent;
  }

  interface HTMLElementTagNameMap {
    'webdmx-editor': Editor;
  }
}
