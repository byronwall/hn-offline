import { createSignal, onCleanup, onMount, ParentProps } from "solid-js";

import { cn } from "~/lib/utils";

import { Shell } from "./Icon";

type PullToRefreshProps = ParentProps<{
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}>;

type Phase = "idle" | "pulling" | "armed" | "refreshing";

// Finger travel past this many px (after rubber-banding) arms the refresh.
const THRESHOLD = 64;
// Where the content rests while the refresh runs.
const HOLD = 52;
// Rubber-band scale: the pull approaches this distance but never reaches it.
const RANGE = 320;
const ELASTICITY = 0.55;
const MIN_SPIN_MS = 500;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

// iOS-style rubber band: 1:1 at first, then more and more resistance.
const band = (x: number) => RANGE * (1 - 1 / ((x * ELASTICITY) / RANGE + 1));
const unband = (y: number) =>
  ((RANGE / ELASTICITY) * (y / RANGE)) / (1 - y / RANGE);

const vibrate = (ms: number) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
};

export function PullToRefresh(props: PullToRefreshProps) {
  const [phase, setPhase] = createSignal<Phase>("idle");
  let root!: HTMLDivElement;
  let content!: HTMLDivElement;
  let badge!: HTMLDivElement;
  let dial!: HTMLSpanElement;

  // Plain variables, not signals: they change on every touchmove and only
  // feed style writes.
  let offset = 0;
  let touchId: number | undefined;
  let startY = 0;
  let startX = 0;
  let base = 0;
  let mode: "pending" | "pull" | "none" = "none";
  let frame = 0;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  // Transforms only: the list below never relays out during a pull.
  const paint = (y: number, ms = 0) => {
    offset = y;
    const transition = ms ? `transform ${ms}ms ${EASE}` : "";
    const progress = phase() === "refreshing" ? 1 : Math.min(1, y / THRESHOLD);
    content.style.transition = transition;
    // Keep a transform while gliding home; settle() clears it at the end.
    content.style.transform = y || ms ? `translate3d(0, ${y}px, 0)` : "";
    badge.style.transition = ms ? `${transition}, opacity ${ms}ms ${EASE}` : "";
    badge.style.transform = `translate3d(0, ${y - 44}px, 0) scale(${0.85 + 0.15 * progress})`;
    badge.style.opacity = `${progress}`;
    dial.style.transition = transition;
    dial.style.transform = `rotate(${progress * 270}deg)`;
  };

  // Glide to a resting offset. At 0, drop the transform so sticky comment
  // connectors and the fixed nav behave as if this wrapper were not here.
  const settle = (y: number, ms: number) => {
    clearTimeout(settleTimer);
    paint(y, ms);
    if (y === 0) {
      settleTimer = setTimeout(() => {
        content.style.transition = "";
        content.style.transform = "";
      }, ms);
    }
  };

  const refresh = async () => {
    setPhase("refreshing");
    settle(HOLD, 240);
    const minSpin = new Promise((r) => setTimeout(r, MIN_SPIN_MS));
    try {
      await Promise.all([props.onRefresh(), minSpin]);
    } finally {
      setPhase("idle");
      settle(0, 320);
    }
  };

  const onStart = (ev: TouchEvent) => {
    if (touchId !== undefined || props.disabled || phase() === "refreshing") {
      return;
    }
    const gliding = content.style.transform !== "";
    if (window.scrollY > 0 && !gliding) {
      return;
    }
    const touch = ev.changedTouches[0];
    if (!touch) {
      return;
    }
    // Catch the content mid-glide instead of letting it finish first.
    if (gliding) {
      clearTimeout(settleTimer);
      paint(new DOMMatrix(getComputedStyle(content).transform).m42);
    }
    touchId = touch.identifier;
    startY = touch.clientY;
    startX = touch.clientX;
    base = unband(offset);
    mode = offset > 0 ? "pull" : "pending";
  };

  const findTouch = (ev: TouchEvent) =>
    Array.from(ev.changedTouches).find((t) => t.identifier === touchId);

  const onMove = (ev: TouchEvent) => {
    const touch = findTouch(ev);
    if (!touch || mode === "none") {
      return;
    }
    const dy = touch.clientY - startY;
    if (mode === "pending") {
      // Decide on the first move: down and mostly vertical is a pull,
      // anything else is a normal scroll or a sideways swipe.
      const dx = touch.clientX - startX;
      mode = dy > 0 && dy >= Math.abs(dx) ? "pull" : "none";
      if (mode === "none") {
        return;
      }
      setPhase("pulling");
    }
    const travel = base + dy;
    if (travel <= 0) {
      // Pushed back up past the start: hand the gesture back to the scroller.
      mode = "none";
      setPhase("idle");
      paint(0);
      return;
    }
    // Stops the native rubber band (iOS) and native pull-to-refresh
    // (Android Chrome) so only this one moves.
    if (ev.cancelable) {
      ev.preventDefault();
    }
    const y = band(travel);
    const armed = y >= THRESHOLD;
    if (armed !== (phase() === "armed")) {
      setPhase(armed ? "armed" : "pulling");
      if (armed) {
        vibrate(8);
      }
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => paint(y));
  };

  const onEnd = (ev: TouchEvent) => {
    if (!findTouch(ev)) {
      return;
    }
    touchId = undefined;
    cancelAnimationFrame(frame);
    const wasPull = mode === "pull";
    mode = "none";
    if (phase() === "armed") {
      void refresh();
    } else if (wasPull || offset > 0) {
      setPhase("idle");
      settle(0, 320);
    }
  };

  onMount(() => {
    // Native listeners: Solid delegates touch events to the document, where
    // browsers make them passive, so preventDefault would be ignored.
    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd);
    root.addEventListener("touchcancel", onEnd);
    onCleanup(() => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
    });
  });

  return (
    <div ref={root} class="relative w-full">
      <div
        ref={badge}
        aria-hidden="true"
        class={cn(
          "pointer-events-none absolute top-0 left-1/2 -ml-4 flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 transition-colors duration-150",
          {
            "border-hn/40 text-hn-ink":
              phase() === "armed" || phase() === "refreshing",
          }
        )}
        style={{ transform: "translate3d(0, -44px, 0) scale(0.85)" }}
      >
        <span ref={dial} class="flex">
          <Shell
            width="18"
            height="18"
            class={cn({ "animate-spin": phase() === "refreshing" })}
          />
        </span>
      </div>
      <div ref={content}>{props.children}</div>
    </div>
  );
}
