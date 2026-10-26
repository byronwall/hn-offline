import { Show } from "solid-js";

import { useCommentStore } from "~/contexts/AppDataContext";
import { isLinkOrSelection } from "~/lib/isLinkOrSelection";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { flash, keepInView, scrollToElement } from "~/lib/scroll";
import { cn } from "~/lib/utils";

import type { HnItem } from "~/models/interfaces";

type HnStoryContentCardProps = {
  story: HnItem;
};

// The post text of an Ask/Show HN story. Click to collapse it, like a comment.
export const HnStoryContentCard = (props: HnStoryContentCardProps) => {
  const commentStore = useCommentStore();
  let cardRef: HTMLDivElement | undefined;

  const textHtml = () =>
    processHtmlAndTruncateAnchorText(props.story.text ?? "");
  const isOpen = () =>
    commentStore.collapsedTimestamps[props.story.id] === undefined;

  function handleClick(e: MouseEvent) {
    if (isLinkOrSelection(e)) {
      return;
    }
    const collapsing = isOpen();
    commentStore.updateCollapsedState(props.story.id, collapsing);
    if (!cardRef) {
      return;
    }
    // Collapsing the post moves on to the first open comment.
    const first = collapsing
      ? document.querySelector("[data-comment]:not(.collapsed)")
      : null;
    if (first) {
      scrollToElement(first, true);
    } else {
      keepInView(cardRef);
    }
    flash(cardRef);
  }

  return (
    <div
      ref={cardRef}
      class={cn("bp3-card mb-2 cursor-pointer pl-4", { collapsed: !isOpen() })}
      onClick={handleClick}
      style={{ "--flash-color": "var(--color-hn)" }}
    >
      <Show
        when={isOpen()}
        fallback={<p class="text-[15px] text-slate-500">Show post text</p>}
      >
        {/* eslint-disable-next-line solid/no-innerhtml */}
        <div class="user-text comment break-words" innerHTML={textHtml()} />
      </Show>
    </div>
  );
};
