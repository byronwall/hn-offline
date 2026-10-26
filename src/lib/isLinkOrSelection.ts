// A click on a card toggles collapse, except when the user clicked a link or
// button, or finished selecting text.
export function isLinkOrSelection(e: MouseEvent) {
  if (e.target instanceof Element && e.target.closest("a, button")) {
    return true;
  }
  return (window.getSelection()?.toString().length ?? 0) > 0;
}
