import type { TemplateResult } from 'lit';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, eventOptions, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { DeviceData, UniverseData } from '../../../utils/data.utils.js';
import { DropTarget, prepareDrag, processDrop } from '../../../utils/drag-drop.utils.js';
import { presets } from '../../../utils/preset.utils.js';
import type { DeviceEditorChangeEvent } from '../device-editor/device-editor.component.js';
import { DeviceEditor } from '../device-editor/device-editor.component.js';

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
  private presets = presets;

  @property({ type: Object, attribute: false, noAccessor: true })
  set universe(universe: Readonly<UniverseData> | undefined) {
    // update internal state
    const oldUniverse = this.#universe;
    this.#universe = universe;

    // update presets with detailed information
    const names = this.#universe?.devices.map(({ preset }) => preset) ?? [];
    this.presets.load(...names).then(() => {
      this.requestUpdate('universe', oldUniverse);
    });
  }

  @eventOptions({ passive: true })
  private async handleDeviceChange({ detail, target }: DeviceEditorChangeEvent) {
    // read the selected index and data
    const { deviceIndex } = target as DeviceEditor;
    if (deviceIndex === undefined) return;
    // update corresponding device
    const devices = this.#universe?.devices?.slice() ?? [];
    devices[deviceIndex] = { ...this.#universe?.devices?.[deviceIndex], ...detail };
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ passive: true })
  private async handleDeviceDuplicate({ target }: CustomEvent<void>) {
    // read the selected index
    const { deviceIndex } = target as DeviceEditor;
    if (deviceIndex === undefined) return;
    // duplicate device
    const devices = this.#universe?.devices?.slice() ?? [];
    const duplicate = structuredClone(devices[deviceIndex]);
    devices.push({ ...duplicate, position: { x: 0, y: 0 } });
    // emit the change event
    this.#emitChangeEvent(devices);
  }

  @eventOptions({ passive: true })
  private async handleDeviceRemove({ target }: CustomEvent<void>) {
    // read the selected index
    const { deviceIndex } = target as DeviceEditor;
    if (deviceIndex === undefined) return;
    // update corresponding device
    const devices = this.#universe?.devices?.slice() ?? [];
    devices.splice(deviceIndex, 1);
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
    const element = prepareDrag<DeviceEditor>(event, (element) => `${element.deviceIndex}`);
    element.dataset.dragging = String(true);

    // close the parameter editor popup
    element.parameterEditorVisible = false;
  }

  @eventOptions({ passive: true })
  override async dropCallback(event: DragEvent) {
    // process drop event and retrieve element reference
    const getElement = (serial: string) =>
      this.renderRoot.querySelector<DeviceEditor>(`[device-index="${serial}"]`) ?? undefined;
    const { element, position } = processDrop(event, getElement, false);

    if (element === undefined) return;
    element.dataset.dragging = undefined;

    // update corresponding device position
    const { deviceIndex } = element;
    if (deviceIndex === undefined) return;
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
        (_, index) => html`
          <webdmx-device-editor
            draggable="true"
            device-index="${index}"
            ?autofocus="${index === 0}"
            .devices="${this.#universe?.devices}"
            @dragstart="${this.handleDragStart}"
            @webdmx-device-parameter-editor:change="${this.handleDeviceChange}"
            @webdmx-device-editor:duplicate="${this.handleDeviceDuplicate}"
            @webdmx-device-editor:remove="${this.handleDeviceRemove}"
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
