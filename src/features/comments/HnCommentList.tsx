import {
  createEffect,
  createSignal,
  For,
  on,
  onCleanup,
  untrack,
} from "solid-js";

import { isValidComment } from "~/lib/isValidComment";
import { KidsObj3 } from "~/models/interfaces";

import { HnComment } from "./HnComment";

interface HnCommentListProps {
  childComments: Array<KidsObj3 | null>;
  depth: number;
  authorChain: (string | undefined)[];
  // Render top-level threads a few per frame so the first screen paints fast.
  progressive?: boolean;
}

const THREADS_PER_FRAME = 8;

export function HnCommentList(props: HnCommentListProps) {
  const comments = () => props.childComments.filter(isValidComment);

  const [shownCount, setShownCount] = createSignal(
    untrack(() => props.progressive) ? THREADS_PER_FRAME : Infinity
  );

  createEffect(
    on(comments, (list) => {
      if (!props.progressive) {
        return;
      }

      setShownCount(THREADS_PER_FRAME);
      let frameId = 0;
      const step = () => {
        if (shownCount() >= list.length) {
          return;
        }
        setShownCount((count) => count + THREADS_PER_FRAME);
        frameId = requestAnimationFrame(step);
      };
      frameId = requestAnimationFrame(step);
      onCleanup(() => cancelAnimationFrame(frameId));
    })
  );

  const shown = () => comments().slice(0, shownCount());

  return (
    <For each={shown()}>
      {(comment) => (
        <HnComment
          comment={comment}
          depth={props.depth}
          authorChain={props.authorChain}
        />
      )}
    </For>
  );
}
