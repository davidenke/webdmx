import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { use } from 'lit-shared-state';

import { config, type DeviceConfig, type UniverseConfig } from '../../../state/config.state.js';
import { presets } from '../../../state/presets.state.js';
import { DeviceEditor, type DeviceEditorChangeEvent } from '../device-editor/device-editor.component.js';
import styles from './editor.component.scss?inline';

export type EditorChangeEvent = CustomEvent<Partial<DeviceConfig>[]>;

const DRAG_OFFSET_SPLIT = ';';

/**
 * @element webdmx-editor
 */
@customElement('webdmx-editor')
export class Editor extends LitElement {
  static override readonly styles = unsafeCSS(styles);

  #universeIndex?: number;

  @use() private config = config;
  @use() private presets = presets;

  get #universe(): UniverseConfig | undefined {
    return this.config.universes[this.#universeIndex!];
  }

  @property({ type: Number, reflect: true, attribute: 'universe-index', noAccessor: true })
  set universeIndex(universeIndex: number) {
    // update internal state
    this.#universeIndex = universeIndex;

    // update presets with detailed information
    const names = this.#universe?.devices.map(({ preset }) => preset) ?? [];
    this.presets.loadPreset(...names).then(() => this.requestUpdate('universeIndex'));
  }
  get universeIndex(): number {
    return this.#universeIndex!;
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

    // gather pointer offset and element reference
    const { clientX, clientY, target } = event;
    const deviceElement = target as DeviceEditor;
    const { dataset } = deviceElement;
    const { x, y, height, width } = deviceElement.getBoundingClientRect();

    // prepare and set data as serialized payload for event transfer
    const data = [dataset.deviceIndex, clientX - (x + width / 2), clientY - (y + height / 2)];
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', data.join(DRAG_OFFSET_SPLIT));

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
    // gather information and element reference
    const { clientX, clientY, dataTransfer } = event;
    const [index, offsetX, offsetY] = dataTransfer!.getData('text/plain').split(DRAG_OFFSET_SPLIT);
    const deviceIndex = parseInt(index);

    // reset dragging state
    const deviceSelector = `webdmx-device-editor[data-device-index="${deviceIndex}"]`;
    const deviceElement = this.renderRoot.querySelector(deviceSelector) as DeviceEditor;
    deviceElement.dragging = false;

    // calculate new (relative) position (as percentage)
    const clientRect = this.getBoundingClientRect();
    const deviceX = clientX - clientRect.x - parseInt(offsetX);
    const deviceY = clientY - clientRect.y - parseInt(offsetY);
    const x = (deviceX / clientRect.width) * 100;
    const y = (deviceY / clientRect.height) * 100;
    const position = { x, y };

    // update corresponding device position
    const devices = this.#universe?.devices?.slice() ?? [];
    devices[deviceIndex] = { ...this.#universe?.devices?.[deviceIndex], position };
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  #emitChangeEvent(devices: Partial<DeviceConfig>[]) {
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
            .deviceConfig="${device}"
            @dragstart="${this.handleDragStart}"
            @webdmx-device-parameter-editor:change="${this.handleDeviceChange}"
            @webdmx-device-editor:remove="${this.handleDeviceRemove}"
            style="${styleMap({
              '--webdmx-device-editor-x': `${device.position?.x ?? 50}%`,
              '--webdmx-device-editor-y': `${device.position?.y ?? 50}%`,
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
