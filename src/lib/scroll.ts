// Room for the fixed nav bar and the sticky reply connectors.
export const SCROLL_TOP_OFFSET = 88;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Smooth scroll that never takes a long ride: far targets jump most of the
// way at once, then glide the last ~half screen so the eye can follow.
export function scrollToY(top: number) {
  const target = Math.max(0, top);
  if (prefersReducedMotion()) {
    window.scrollTo({ top: target, behavior: "instant" });
    return;
  }

  const delta = target - window.scrollY;
  const glide = window.innerHeight * 0.5;
  if (Math.abs(delta) > glide * 2) {
    window.scrollTo({
      top: target - Math.sign(delta) * glide,
      behavior: "instant",
    });
  }
  window.scrollTo({ top: target, behavior: "smooth" });
}

export function scrollToElement(el: Element) {
  scrollToY(
    window.scrollY + el.getBoundingClientRect().top - SCROLL_TOP_OFFSET
  );
}

// Scroll to the first element matching `selector` below the current spot.
export function scrollToNext(selector: string) {
  const next = Array.from(document.querySelectorAll(selector)).find(
    (el) => el.getBoundingClientRect().top > SCROLL_TOP_OFFSET + 4
  );
  if (next) {
    scrollToElement(next);
  }
}

// After a collapse or expand, keep `el` on screen without animating: if it
// ended up above the top edge, pin it just under the nav bar.
export function keepInView(el: Element) {
  const top = el.getBoundingClientRect().top;
  if (top < SCROLL_TOP_OFFSET - 40) {
    window.scrollTo({
      top: window.scrollY + top - SCROLL_TOP_OFFSET,
      behavior: "instant",
    });
  }
}

// Brief tint so the eye finds the row that just changed.
export function flash(el: Element) {
  el.classList.remove("flash");
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add("flash");
  el.addEventListener("animationend", () => el.classList.remove("flash"), {
    once: true,
  });
}
