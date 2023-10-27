import type { LitElement } from 'lit';

import type { Position } from './data.utils.js';

export const DRAG_PAYLOAD_SPLIT = ';';

/**
 * Prepares a drag event for an element and derives the
 * element reference from the event.
 */
export function prepareDrag<R extends HTMLElement = HTMLElement>(event: DragEvent): R {
  // gather pointer offset
  const { clientX, clientY, target } = event;

  // gather element reference and set dragging state
  const element = target as R;
  const { x, y, height, width } = element.getBoundingClientRect();
  element.dataset.dragging = 'true';

  // the device element is positioned with its center
  const offsetX = clientX - (x + width / 2);
  const offsetY = clientY - (y + height / 2);

  // prepare and set data as serialized payload for event transfer
  const data = [offsetX, offsetY];
  event.dataTransfer!.effectAllowed = 'move';
  event.dataTransfer!.setData('text/plain', data.join(DRAG_PAYLOAD_SPLIT));

  // deliver the associated element
  return element;
}

/**
 * Processes a given drop event for an element and derives
 * the new position of the element in the event target.
 */
export function processDrop<R extends HTMLElement = HTMLElement>(
  /**
   * The original drag event. The event target will be used as drop target.
   */
  event: DragEvent,

  /**
   * Use relative position as percentage instead of absolute position in pixels.
   */
  usePercentage = true,
): {
  /**
   * The element reference that was dragged.
   */
  element: R;

  /**
   * The new position of the element.
   */
  position: Position;
} {
  // gather information and element reference
  const { clientX, clientY, dataTransfer, target } = event;
  const [offsetX, offsetY] = dataTransfer!.getData('text/plain').split(DRAG_PAYLOAD_SPLIT);
  const dropTarget = target as HTMLElement;
  const dropRoot = dropTarget.shadowRoot ?? dropTarget;

  // retrieve the element reference
  const element = dropRoot.querySelector<R>(`[data-dragging="true"]`)!;
  element.dataset.dragging = undefined;

  // calculate new (relative) position (as percentage)
  const clientRect = dropTarget.getBoundingClientRect();
  const absX = clientX - clientRect.x - parseInt(offsetX);
  const absY = clientY - clientRect.y - parseInt(offsetY);
  const relX = usePercentage ? (absX / clientRect.width) * 100 : absX;
  const relY = usePercentage ? (absY / clientRect.height) * 100 : absY;
  const position = { x: relX, y: relY };

  // return the element reference and its new position
  return { element, position };
}

// assistive type for mixin return type
export declare class DropTargetInterface {
  protected dropCallback(event: DragEvent): void;
}

/**
 * As drop targets have to handle some drag events, we provide
 * a helper mixin for convenience.
 */
export const DropTarget = <T extends Constructor<LitElement>>(superClass: T) => {
  class DropTarget extends superClass {
    private handleDragging(event: DragEvent) {
      // cancel default behavior to allow drop by preventing
      // the dragenter, dragover and dragleave events
      // https://stackoverflow.com/a/21341021/1146207
      // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#performing_a_drop
      event.preventDefault();
    }

    /**
     * Handles the drop event
     */
    protected dropCallback() {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('drop', this.dropCallback, { passive: true });
      this.addEventListener('dragenter', this.handleDragging, { capture: true });
      this.addEventListener('dragleave', this.handleDragging, { capture: true });
      this.addEventListener('dragover', this.handleDragging, { capture: true });
    }

    override disconnectedCallback() {
      this.removeEventListener('drop', this.dropCallback);
      this.removeEventListener('dragenter', this.handleDragging, { capture: true });
      this.removeEventListener('dragleave', this.handleDragging, { capture: true });
      this.removeEventListener('dragover', this.handleDragging, { capture: true });
      super.disconnectedCallback();
    }
  }

  // cast return type to your mixin's interface intersected with the superClass type
  // https://lit.dev/docs/composition/mixins/#when-a-mixin-adds-new-publicprotected-api
  return DropTarget as unknown as Constructor<DropTargetInterface> & T;
};
