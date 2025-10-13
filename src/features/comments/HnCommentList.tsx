import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";

import { KidsObj3 } from "~/models/interfaces";

import { HnComment } from "./HnComment";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;
  authorChain: (string | undefined)[];
}

const BATCH_SIZE = 1;
const PAD_PX = 200;

export function HnCommentList(props: HnCommentListProps) {
  const children = createMemo(
    () => props.childComments.filter(Boolean) as KidsObj3[]
  );
  const total = createMemo(() => children().length);

  const [visibleCount, setVisibleCount] = createSignal(0);
  const visible = createMemo(() =>
    children().slice(0, Math.min(visibleCount(), total()))
  );
  const showMore = createMemo(() => visible().length < total());

  // Initialize + clamp when children change
  createEffect(() => {
    const t = total();
    if (t === 0) {
      return setVisibleCount(0);
    }
    setVisibleCount((c) =>
      c === 0 ? Math.min(BATCH_SIZE, t) : Math.min(c, t)
    );
  });

  const [sentinel, setSentinel] = createSignal<HTMLDivElement | null>(null);
  const [intersecting, setIntersecting] = createSignal(false);

  let observer: IntersectionObserver | null = null;
  let rafId: number | null = null;

  const cancelRaf = () => {
    if (rafId === null) {
      return;
    }
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  const stepPump = (node: HTMLElement) => {
    // stop if IO says not intersecting, or no more items, or node gone
    if (!intersecting() || !showMore() || !node.isConnected) {
      rafId = null;
      return;
    }
    const t = total();
    setVisibleCount((c) => Math.min(c + BATCH_SIZE, t));
    rafId = requestAnimationFrame(() => stepPump(node));
  };

  const ensurePumpRunning = (node: HTMLElement) => {
    if (rafId != null) {
      return;
    }
    if (intersecting() && showMore()) {
      rafId = requestAnimationFrame(() => stepPump(node));
    }
  };

  // Observe the sentinel with the scrollRoot as IO root
  createEffect(() => {
    const node = sentinel();
    if (!node) {
      return;
    }

    observer?.disconnect();
    cancelRaf();
    setIntersecting(false);

    observer = new IntersectionObserver(
      ([entry]) => {
        const on = !!entry?.isIntersecting;
        setIntersecting(on);
        if (on) {
          ensurePumpRunning(node);
        } else {
          cancelRaf();
        }
      },
      {
        root: null,
        rootMargin: `${PAD_PX}px 0px ${PAD_PX}px 0px`, // symmetric pad
        threshold: 0, // fire as soon as it touches the padded root
      }
    );

    observer.observe(node);

    // If it mounts already visible, IO may not fire until next frame: nudge it.
    queueMicrotask(() => ensurePumpRunning(node));

    onCleanup(() => {
      observer?.disconnect();
      observer = null;
      cancelRaf();
    });
  });

  // If showMore flips true (e.g., after collapse/expand), try to (re)start the pump.
  createEffect(() => {
    const node = sentinel();
    if (node && showMore()) {
      queueMicrotask(() => ensurePumpRunning(node));
    } else {
      cancelRaf();
    }
  });

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

      <Show when={showMore()}>
        <div ref={setSentinel} style={{ height: "1px" }} />
      </Show>
    </>
  );
}
