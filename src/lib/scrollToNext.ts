// Room for the fixed nav bar and the sticky reply connectors.
export const SCROLL_TOP_OFFSET = 88;

export function scrollToElement(el: Element) {
  const top =
    window.scrollY + el.getBoundingClientRect().top - SCROLL_TOP_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

// Scroll to the first element matching `selector` below the current spot.
// Returns false when there is none.
export function scrollToNext(selector: string) {
  const next = Array.from(document.querySelectorAll(selector)).find(
    (el) => el.getBoundingClientRect().top > SCROLL_TOP_OFFSET + 4
  );
  if (!next) {
    return false;
  }
  scrollToElement(next);
  return true;
}
