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
}

export function HnCommentList(props: HnCommentListProps) {
  const validChildren = () =>
    props.childComments.filter((comm) => comm !== null);

  const [visibleCount, setVisibleCount] = createSignal(0);
  const [sentinel, setSentinel] = createSignal<HTMLDivElement | null>(null);
  const [rafId, setRafId] = createSignal<number | null>(null);

  const BATCH_SIZE = 1;

  // Initialize and keep visible count in bounds when children change
  createEffect(() => {
    const length = validChildren().length;
    if (visibleCount() === 0) {
      setVisibleCount(Math.min(BATCH_SIZE, length));
      return;
    }
    if (visibleCount() > length) {
      setVisibleCount(length);
    }
  });

  const visibleChildren = createMemo(() =>
    validChildren().slice(0, Math.min(visibleCount(), validChildren().length))
  );

  function isSentinelVisibleWithPadding(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    const padding = 200; // keep in sync with rootMargin bottom
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const verticallyVisible =
      rect.top <= viewportHeight + padding && rect.bottom >= -padding;
    const horizontallyVisible = rect.left <= viewportWidth && rect.right >= 0;
    return verticallyVisible && horizontallyVisible;
  }

  function scheduleCheckAndLoad(node: HTMLElement) {
    const total = validChildren().length;
    if (visibleCount() >= total) {
      return;
    }
    const id = requestAnimationFrame(() => {
      setRafId(null);
      if (isSentinelVisibleWithPadding(node)) {
        setVisibleCount((c) => Math.min(c + BATCH_SIZE, total));
        scheduleCheckAndLoad(node);
      }
    });
    setRafId(id);
  }

  // Observe the sentinel to grow the visible window as it comes into view
  createEffect(() => {
    const node = sentinel();
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (entry.isIntersecting) {
          console.log("*** isIntersecting", entry);
          const length = validChildren().length;
          if (visibleCount() < length) {
            console.log("*** visibleCount increasing", visibleCount(), length);
            setVisibleCount((c) => Math.min(c + BATCH_SIZE, length));
            // After adding more, ensure we keep loading if the sentinel remains visible
            if (node) {
              scheduleCheckAndLoad(node);
            }
          }
        }
      },
      {
        // slight padding so we load a bit before it fully enters viewport
        rootMargin: "0px 0px 200px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);
    onCleanup(() => {
      observer.disconnect();
      const id = rafId();
      if (id !== null) {
        cancelAnimationFrame(id);
      }
    });
  });

  return (
    <>
      <For each={visibleChildren()}>
        {(childComm) => (
          <HnComment
            comment={childComm}
            depth={props.depth}
            authorChain={props.authorChain}
          />
        )}
      </For>
      {visibleChildren().length < validChildren().length && (
        <div ref={setSentinel} style={{ height: "1px" }} />
      )}
    </>
  );
}
