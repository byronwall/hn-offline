import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
} from "solid-js";

import { KidsObj3 } from "~/models/interfaces";

import { HnComment } from "./HnComment";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;
  authorChain: (string | undefined)[];
  batchSize?: number; // optional customization
  padPx?: number; // optional visibility padding
}

export function HnCommentList(props: HnCommentListProps) {
  // --- Config ---------------------------------------------------
  const BATCH_SIZE = props.batchSize ?? 1;
  const PAD_PX = props.padPx ?? 200; // keep in sync with rootMargin

  // --- Data derivation ------------------------------------------
  const children = createMemo(() => {
    const filtered = props.childComments.filter(Boolean) as KidsObj3[];
    console.log("[children] recomputed:", filtered.length);
    return filtered;
  });

  const total = createMemo(() => children().length);
  const [visibleCount, setVisibleCount] = createSignal(0);

  // Initialize + clamp when children change
  createEffect(() => {
    const t = total();
    if (t === 0) {
      if (visibleCount() !== 0) {
        setVisibleCount(0);
      }
      return;
    }
    setVisibleCount((c) => {
      if (c === 0) {
        console.log("[visibleCount] init ->", Math.min(BATCH_SIZE, t));
        return Math.min(BATCH_SIZE, t);
      }
      const clamped = Math.min(c, t);
      if (clamped !== c) {
        console.log("[visibleCount] clamp ->", clamped, "(total:", t, ")");
      }
      return clamped;
    });
  });

  const visible = createMemo(() => {
    const out = children().slice(0, Math.min(visibleCount(), total()));
    return out;
  });

  const visibleLen = createMemo(() => visible().length);
  const showMore = createMemo(() => visibleLen() < total());

  // --- Sentinel & loading loop ---------------------------------
  const [sentinel, setSentinel] = createSignal<HTMLDivElement | null>(null);
  let observer: IntersectionObserver | null = null;
  let rafId: number | null = null;

  const cancelRaf = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      console.log("[raf] canceled");
    }
  };

  const isPaddedVisible = (el: HTMLElement): boolean => {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vVis = rect.top <= vh + PAD_PX && rect.bottom >= -PAD_PX;
    const hVis = rect.left <= vw && rect.right >= 0;
    return vVis && hVis;
  };

  const pumpWhileVisible = (node: HTMLElement) => {
    cancelRaf();
    const step = () => {
      if (!node) {
        return;
      }
      if (!isPaddedVisible(node)) {
        // Stop if sentinel escaped our padded viewport
        console.log("[pump] stop (not visible)");
        rafId = null;
        return;
      }
      const t = total();
      if (visibleCount() >= t) {
        console.log("[pump] stop (all loaded)");
        rafId = null;
        return;
      }
      setVisibleCount((c) => Math.min(c + BATCH_SIZE, t));
      console.log(
        "[pump] +",
        BATCH_SIZE,
        "->",
        visibleCount() + BATCH_SIZE,
        "/",
        t
      );
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  };

  // Observe the sentinel; kick off pump when it intersects
  createEffect(() => {
    const node = sentinel();
    if (!node) {
      return;
    }

    // Ensure clean prev
    observer?.disconnect();
    cancelRaf();

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        console.log("[io] intersect -> pump");
        pumpWhileVisible(node);
      },
      { rootMargin: `0px 0px ${PAD_PX}px 0px`, threshold: 0.01 }
    );

    observer.observe(node);
    onCleanup(() => {
      observer?.disconnect();
      observer = null;
      cancelRaf();
    });
  });

  // --- Render ---------------------------------------------------
  return (
    <>
      <For each={visible()}>
        {(child) => (
          <HnComment
            comment={child}
            depth={props.depth}
            authorChain={props.authorChain}
          />
        )}
      </For>

      {showMore() && <div ref={setSentinel} style={{ height: "1px" }} />}
    </>
  );
}
