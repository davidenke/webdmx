import type { Popup } from './popup.component.js';

// stores the popup references
const popups = new Set<Popup>();

export function registerPopup(popup: Popup) {
  popups.add(popup);
}

export function unregisterPopup(popup: Popup) {
  popups.delete(popup);
}

export function hideOtherPopupsThan(popup: Popup) {
  popups.forEach(ref => {
    if (ref !== popup) {
      ref.hidden = true;
    }
  });
}
