/**
 * Utility function to check if an element (needle) is the same or within a list
 * of elements (haystack). This comes in handy when e.g. checking for clicks
 * outside of an element.
 */
export function isSameOrWithin(haystack: ArrayLike<Element>, needle: Element): boolean {
  return Array.from(haystack).some(child => {
    // check if the current child is the needle
    if (child.isSameNode(needle)) {
      return true;
    }
    // check if the current child contains the needle
    if (child.contains(needle)) {
      return true;
    }
    // collect all children and light dom children
    const children = [
      ...Array.from(child.children),
      ...Array.from(child.shadowRoot?.children ?? []),
    ];
    // check all children recursively
    if (children.length) {
      return isSameOrWithin(children, needle);
    }
    // no match found
    return false;
  });
}
