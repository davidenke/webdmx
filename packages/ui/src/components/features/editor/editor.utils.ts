import type { Position } from '../../../utils/data.utils.js';
import type { DeviceEditor } from '../device-editor/device-editor.component.js';

export const DRAG_PAYLOAD_SPLIT = ';';

/**
 * Prepares a drag event for a device element and derives the
 * device element from the event.
 */
export function prepareDeviceDrag(event: DragEvent): DeviceEditor {
  // gather pointer offset and element reference
  const { clientX, clientY, target } = event;
  const deviceElement = target as DeviceEditor;
  const { dataset } = deviceElement;
  const { x, y, height, width } = deviceElement.getBoundingClientRect();

  // the device element is positioned with its center
  const offsetX = clientX - (x + width / 2);
  const offsetY = clientY - (y + height / 2);

  // prepare and set data as serialized payload for event transfer
  const data = [dataset.deviceIndex, offsetX, offsetY];
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('text/plain', data.join(DRAG_PAYLOAD_SPLIT));

  // deliver the associated device element
  return deviceElement;
}

/**
 * Processes a given drop event for a device element and derives
 * the new position of the device in the event target.
 */
export function processDeviceDrop(
  event: DragEvent,
  /**
   * Use relative position as percentage instead of absolute position in pixels.
   */
  usePercentage = true,
): {
  deviceElement: DeviceEditor;
  deviceIndex: number;
  position: Position;
} {
  // gather information and element reference
  const { clientX, clientY, dataTransfer, target } = event;
  const [index, offsetX, offsetY] = dataTransfer!.getData('text/plain').split(DRAG_PAYLOAD_SPLIT);
  const dropTarget = target as HTMLElement;
  const dropRoot = dropTarget.shadowRoot ?? dropTarget;
  const deviceIndex = parseInt(index);
  const deviceSelector = `webdmx-device-editor[data-device-index="${deviceIndex}"]`;
  const deviceElement = dropRoot.querySelector(deviceSelector) as DeviceEditor;

  // calculate new (relative) position (as percentage)
  const clientRect = dropTarget.getBoundingClientRect();
  const deviceX = clientX - clientRect.x - parseInt(offsetX);
  const deviceY = clientY - clientRect.y - parseInt(offsetY);
  const x = usePercentage ? (deviceX / clientRect.width) * 100 : deviceX;
  const y = usePercentage ? (deviceY / clientRect.height) * 100 : deviceY;
  const position = { x, y };

  // return the device index and its new position
  return { deviceElement, deviceIndex, position };
}
