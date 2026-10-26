import { createEffect, createMemo, Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import {
  useCommentStore,
  useRelativeTime,
  useStoryUiStore,
} from "~/contexts/AppDataContext";
import { formatCommentText } from "~/lib/commentUtils";
import { shareHnTextContent } from "~/lib/shareHnTextContent";
import { cn } from "~/lib/utils";
import { KidsObj3 } from "~/models/interfaces";

import { HnCommentList } from "./HnCommentList";

export interface HnCommentProps {
  comment: KidsObj3;
  depth: number;
  authorChain: (string | undefined)[];
}

const paddingByDepth = [16, 15, 14, 13, 12, 12, 12, 12, 12, 12, 12, 12, 12];
const barWidths = paddingByDepth.map((val) => val + 4);

export function HnComment(props: HnCommentProps) {
  const storyUiStore = useStoryUiStore();
  const commentStore = useCommentStore();
  const relativeTime = useRelativeTime();
  let headerRef: HTMLParagraphElement | undefined;

  const isOpen = () =>
    commentStore.collapsedTimestamps[props.comment.id] === undefined;

  createEffect(() => {
    if (!storyUiStore.isScrollTarget(props.comment.id)) {
      return;
    }

    requestAnimationFrame(() => {
      if (!headerRef) {
        return;
      }

      // leave room for the fixed nav bar
      const top = window.scrollY + headerRef.getBoundingClientRect().top - 88;
      window.scrollTo({ top, behavior: "smooth" });
      storyUiStore.clearScrollToId();
    });
  });

  const handleShareClick = async (e: MouseEvent) => {
    e.stopPropagation();
    await shareHnTextContent({
      contentLabel: "Comment",
      contentId: props.comment.id,
      author: props.comment.by,
      contentHtml: props.comment.text || "",
      storyId: storyUiStore.activeStoryData()?.id,
      storyExternalUrl: storyUiStore.activeStoryData()?.url,
    });
  };

  function handleCardClick(e: MouseEvent) {
    e.stopPropagation();

    if (e.target instanceof HTMLElement && e.target.tagName === "A") {
      return;
    }

    commentStore.handleCollapseEvent(props.comment.id, !isOpen());
  }

  const stickyInfo = createMemo(() => {
    const depthMatchInAuthorChain = props.authorChain.lastIndexOf(
      props.comment.by || undefined
    );

    const shouldShowBar = depthMatchInAuthorChain >= 0;

    let leftPos = 0;
    if (shouldShowBar) {
      leftPos = barWidths
        .slice(depthMatchInAuthorChain, props.depth)
        .reduce((acc, val) => acc - val, 0);
    }

    const stickyTop = 40 + depthMatchInAuthorChain * 8;
    const stickyHeight = Math.max(24 - depthMatchInAuthorChain * 8, 16);

    return {
      shouldShowBar,
      stickyTop,
      stickyHeight,
      leftPos,
    };
  });

  const borderColor = () =>
    storyUiStore.colorMap()[props.comment.by ?? ""] ?? "transparent";
  const showBar = () => stickyInfo().shouldShowBar && isOpen();

  return (
    <div
      class={cn("bp3-card user-text relative", { collapsed: !isOpen() })}
      onClick={handleCardClick}
      style={{
        "--flash-color": borderColor(),
        "padding-left": `${16 + Math.max(4 - props.depth, 0)}px`,
        "margin-left": 0,
      }}
    >
      <Show when={showBar()}>
        <div
          style={{
            position: "sticky",
            top: `${stickyInfo().stickyTop}px`,
            height: `${stickyInfo().stickyHeight}px`,
            "pointer-events": "none",
          }}
        >
          <div
            class="comment-connector"
            style={{
              top: "7px",
              left: `${stickyInfo().leftPos - paddingByDepth[props.depth]}px`,
              width: `${Math.abs(stickyInfo().leftPos) + 6}px`,
              height: "8px",
            }}
          />
        </div>
      </Show>
      <div class="group flex flex-col gap-1">
        <p
          style={{
            "font-weight": isOpen() ? 450 : 300,
            "margin-top": `${showBar() ? -stickyInfo().stickyHeight : 0}px`,
          }}
          ref={headerRef}
          class={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[16px]",
            isOpen() ? "text-slate-700" : "text-slate-500"
          )}
        >
          <span
            class={cn(
              "truncate",
              isOpen()
                ? {
                    "font-bold text-orange-700":
                      storyUiStore.activeStoryData()?.by === props.comment.by,
                    "font-medium":
                      storyUiStore.activeStoryData()?.by !== props.comment.by,
                  }
                : "font-normal"
            )}
          >
            {props.comment.by}
          </span>
          <Show when={isOpen()}>
            <span class="text-slate-300 select-none">|</span>
            <span>{relativeTime(props.comment.time)}</span>
            <span class="pointer-events-none text-slate-300 opacity-0 transition-opacity select-none group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              |
            </span>
            <button
              onClick={handleShareClick}
              class="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-orange-500 [@media(hover:none)]:opacity-100"
              aria-label="Share"
            >
              <ArrowUpRightFromSquare width={16} />
            </button>
          </Show>
        </p>
        <Show when={isOpen()}>
          <div
            class="comment"
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={formatCommentText(props.comment.text || "")}
          />
        </Show>
      </div>
      <Show when={isOpen() && props.comment.kidsObj?.length}>
        <HnCommentList
          childComments={props.comment.kidsObj ?? []}
          depth={props.depth + 1}
          authorChain={[...props.authorChain, props.comment.by]}
        />
      </Show>
    </div>
  );
}
