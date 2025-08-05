import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";
import { createEffect, createMemo, createSignal, Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { isValidComment } from "~/lib/isValidComment";
import { cn, isNavigator, timeSince } from "~/lib/utils";
import { KidsObj3, useDataStore } from "~/stores/useDataStore";

import { HnCommentList } from "./HnCommentList";

export interface HnCommentProps {
  comment: KidsObj3;
  depth: number;
  authorChain: (string | undefined)[];
}

export function HnComment(props: HnCommentProps) {
  const [divRef, setDivRef] = createSignal<HTMLDivElement | null>(null);

  const clearScrollToId = useDataStore((s) => s.clearScrollToId);
  const scrollToId = useDataStore((s) => s.scrollToId);
  const collapsedIds = useDataStore((s) => s.collapsedIds);

  const colorMap = useDataStore((s) => s.colorMap);
  const storyData = useDataStore((s) => s.activeStoryData);

  const _isOpen = () => collapsedIds()[props.comment.id] !== true;
  const [isOpen, setIsOpen] = createSignal(_isOpen());

  const onUpdateOpen = useDataStore((s) => s.handleCollapseEvent);

  createEffect(() => {
    // update when IndexedDB changes
    // TODO: this should all go away once it's reactive
    setIsOpen(_isOpen());
  });

  // TODO: review this one
  createEffect(() => {
    if (scrollToId() !== props.comment?.id) {
      return;
    }

    requestAnimationFrame(() => {
      const dims = divRef()?.getBoundingClientRect().top;

      if (dims === undefined) {
        return;
      }

      // add scrollY to get the absolute position
      // subtract 80 to give a pleasant offset
      const newTop = window.scrollY + dims - 88;

      window.scrollTo({
        top: newTop,
        behavior: "smooth",
      });

      clearScrollToId();
    });
  });

  const handleShareClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.comment === null) {
      return;
    }

    let cleanText = sanitizeHtml(props.comment.text || "");
    cleanText = cleanText.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$1");
    cleanText = cleanText.replace(/<p>/g, "\n");
    cleanText = cleanText.replace(/<[^>]+>/g, "");
    cleanText = decode(cleanText);

    const url = `https://hn.byroni.us/story/${props.comment.id}`;
    const shareText = `Comment by ${props.comment.by} on HN: ${url}\n\n${cleanText}`;

    console.log("share text", shareText);

    if (!isNavigator) {
      return;
    }

    navigator.share?.({
      title: `HN Comment by ${props.comment.by}`,
      text: shareText,
    });
  };

  function handleCardClick(e: MouseEvent) {
    e.stopPropagation();

    if (e.target instanceof HTMLElement && e.target.tagName === "A") {
      return;
    }

    const newIsOpen = !isOpen();
    if (props.comment === null) {
      return;
    }

    onUpdateOpen(props.comment.id, newIsOpen);
    console.log("newIsOpen", newIsOpen);
    setIsOpen(newIsOpen);
  }

  const paddingByDepth = [16, 15, 14, 13, 12, 12, 12, 12, 12, 12, 12, 12, 12];

  const stickyInfo = createMemo(() => {
    const depthMatchInAuthorChain = props.authorChain.lastIndexOf(
      props.comment.by || undefined
    );

    const shouldShowBar = depthMatchInAuthorChain >= 0;

    const widths = paddingByDepth.map((val) => val + 4);

    let leftPos = 0;
    if (shouldShowBar) {
      leftPos = widths
        .slice(depthMatchInAuthorChain, props.depth)
        .reduce((acc, val) => acc - val, 0);
    }

    const stickyTop = 32 + depthMatchInAuthorChain * 8;
    const stickyHeight = Math.max(48 - depthMatchInAuthorChain * 8, 16);

    return {
      shouldShowBar,
      stickyTop,
      stickyHeight,
      leftPos,
    };
  });

  const borderColor = () => colorMap()[props.comment?.by ?? ""] ?? "#000";
  const childComments = () =>
    (props.comment.kidsObj || []).filter(isValidComment);

  return (
    <Show when={isValidComment(props.comment)} fallback={null}>
      <div
        class={cn("bp3-card relative", { collapsed: !isOpen() })}
        onClick={handleCardClick}
        style={{
          "--flash-color": borderColor(),
          "padding-left": `${12 + Math.max(4 - props.depth, 0)}px`,
          "margin-left": 0,
          "border-left-color": borderColor(),
          "border-left-width": "4px",
          "border-top-left-radius": "4px",
          "border-bottom-left-radius": "4px",
        }}
      >
        {stickyInfo().shouldShowBar && isOpen() && (
          <div
            style={{
              position: "sticky",
              top: `${stickyInfo().stickyTop}px`,
              height: `${stickyInfo().stickyHeight}px`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: `${stickyInfo().leftPos - paddingByDepth[props.depth]}px`,
                width: `${Math.abs(stickyInfo().leftPos + 4)}px`,
                "background-color": borderColor(),
                height: "7px",
                "border-top": "2px solid white",
                "border-bottom": "2px solid white",
              }}
            />
          </div>
        )}
        <p
          style={{
            "font-weight": isOpen() ? 450 : 300,
            "margin-top": `${
              stickyInfo().shouldShowBar && isOpen()
                ? -stickyInfo().stickyHeight
                : 0
            }px`,
          }}
          ref={setDivRef}
          class={cn("font-sans flex items-center gap-1")}
        >
          <span
            class={cn({
              "text-orange-700 font-bold": storyData()?.by === props.comment.by,
              truncate: true,
            })}
          >
            {props.comment.by}
          </span>
          <span>{"|"}</span>
          {timeSince(props.comment.time)}
          {" ago"}

          <span>{"|"}</span>
          <button onClick={handleShareClick} class="hover:text-orange-500 ml-1">
            <ArrowUpRightFromSquare size={16} />
          </button>
        </p>
        <Show when={isOpen()}>
          {/* eslint-disable-next-line solid/no-innerhtml */}
          <p class="comment" innerHTML={props.comment.text || ""} />
          {childComments().length > 0 && (
            <HnCommentList
              childComments={childComments()}
              depth={props.depth + 1}
              authorChain={[...props.authorChain, props.comment.by]}
            />
          )}
        </Show>
      </div>
    </Show>
  );
}
