import { html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { DeviceData, UniverseData } from '../../../utils/data.utils.js';
import { DropTarget, prepareDrag, processDrop } from '../../../utils/drag-drop.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import { DeviceEditor, type DeviceEditorChangeEvent } from '../device-editor/device-editor.component.js';
import styles from './editor.component.scss?inline';

export type EditorChangeEvent = CustomEvent<Partial<DeviceData>[]>;

/**
 * @element webdmx-editor
 */
@customElement('webdmx-editor')
export class Editor extends DropTarget(LitElement) {
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
    const element = prepareDrag<DeviceEditor>(event, (element) => element.dataset.deviceIndex!);
    element.dataset.dragging = String(true);

    // close the parameter editor popup
    element.parameterEditorVisible = false;
  }

  @eventOptions({ passive: true })
  override async dropCallback(event: DragEvent) {
    // process drop event and retrieve element reference
    const getElement = (serial: string) =>
      this.renderRoot.querySelector<DeviceEditor>(`[data-device-index="${serial}"]`) ?? undefined;
    const { element, position } = processDrop(event, getElement, false);

    if (element === undefined) return;
    element.dataset.dragging = undefined;

    // update corresponding device position
    const deviceIndex = parseInt(element!.dataset.deviceIndex!);
    const devices = this.#universe?.devices?.slice() ?? [];
    devices[deviceIndex] = { ...this.#universe?.devices?.[deviceIndex], position };

    // emit the change event
    this.#emitChangeEvent(devices);
  }

  #emitChangeEvent(devices: Partial<DeviceData>[]) {
    const options = { detail: devices, bubbles: true, composed: true };
    const event = new CustomEvent('webdmx-editor:change', options);
    this.dispatchEvent(event);
  }

  override render(): TemplateResult {
    return html`
      ${repeat(
        this.#universe?.devices ?? [],
        ({ address }) => address,
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
