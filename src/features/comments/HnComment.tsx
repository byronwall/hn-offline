import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";
import { createEffect, createMemo, createSignal, Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import {
  useActiveStoryStore,
  useColorMapStore,
  useCommentStore,
  useScrollStore,
} from "~/contexts/AppDataContext";
import { formatCommentText } from "~/lib/commentUtils";
import { isValidComment } from "~/lib/isValidComment";
import { cn, shareSafely, timeSince } from "~/lib/utils";
import { KidsObj3 } from "~/models/interfaces";

import { HnCommentList } from "./HnCommentList";

export interface HnCommentProps {
  comment: KidsObj3;
  depth: number;
  authorChain: (string | undefined)[];
}

export function HnComment(props: HnCommentProps) {
  const activeStoryStore = useActiveStoryStore();
  const colorMapStore = useColorMapStore();
  const scrollStore = useScrollStore();
  const commentStore = useCommentStore();
  const [divRef, setDivRef] = createSignal<HTMLDivElement | null>(null);

  // this needs to get one good render so that the DOM matches SSR
  // then it needs to know that the comment store is OK
  const isOpen = () => {
    console.log("*** isOpen", { comment: props.comment });
    if (!props.comment?.id) {
      return true;
    }
    return commentStore.collapsedTimestamps[props.comment.id] === undefined;
  };

  const onCollapse = commentStore.handleCollapseEvent;

  // derive from store; no extra effects needed

  // TODO: review this one
  createEffect(() => {
    if (scrollStore.scrollToId() !== props.comment?.id) {
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

      scrollStore.clearScrollToId();
    });
  });

  const handleShareClick = async (e: MouseEvent) => {
    e.stopPropagation();
    if (props.comment === null) {
      return;
    }

    let cleanText = sanitizeHtml(props.comment.text || "");
    cleanText = cleanText.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$1");
    cleanText = cleanText.replace(/<p>/g, "\n");
    cleanText = cleanText.replace(/<[^>]+>/g, "");
    cleanText = decode(cleanText);

    const commentUrl = `https://hn.byroni.us/story/${props.comment.id}`;
    const storyExternalUrl = activeStoryStore.activeStoryData()?.url;
    // intentionally unused: story title not required in footer
    const storyId = activeStoryStore.activeStoryData()?.id;
    const storyHnUrl = storyId ? `https://hn.byroni.us/story/${storyId}` : "";
    // storyUrl no longer used; keep only HN + external links

    const shareTextLines = [
      `Comment by ${props.comment.by} on HN: ${commentUrl}`,
      "",
      cleanText,
    ];

    if (storyHnUrl || storyExternalUrl) {
      shareTextLines.push("");
      if (storyHnUrl) {
        shareTextLines.push(`HN story: ${storyHnUrl}`);
      }
      if (storyExternalUrl) {
        shareTextLines.push(`Content: ${storyExternalUrl}`);
      }
    }

    const shareText = shareTextLines.join("\n");

    console.log("share text", shareText);

    await shareSafely({
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

    onCollapse(props.comment.id, newIsOpen);
    // no-op log cleanup
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
    colorMapStore.colorMap()[props.comment?.by ?? ""] ?? "transparent";
  const childComments = () =>
    (props.comment.kidsObj || []).filter(isValidComment);

  return (
    <Show when={isValidComment(props.comment)} fallback={null}>
      <div
        class={cn("bp3-card relative", { collapsed: !isOpen() })}
        onClick={handleCardClick}
        style={{
          "--flash-color": borderColor(),
          "padding-left": `${16 + Math.max(4 - props.depth, 0)}px`,
          "margin-left": 0,
        }}
      >
        {stickyInfo().shouldShowBar && isOpen() && (
          <div
            style={{
              position: "sticky",
              top: `${stickyInfo().stickyTop}px`,
              height: `${stickyInfo().stickyHeight}px`,
              "pointer-events": "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "7px",
                left: `${stickyInfo().leftPos - paddingByDepth[props.depth]}px`,
                width: `${Math.abs(stickyInfo().leftPos + 4)}px`,
                "background-color": "white",
                "box-shadow": `inset 0 4px 6px -2px ${borderColor()}`,
                height: "13px",
                "border-top": "3px solid white",
                "border-bottom": "3px solid white",
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
          class={cn(
            "mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[16px]",
            isOpen() ? "text-slate-700" : "text-slate-500"
          )}
        >
          <span
            class={cn(
              "truncate",
              isOpen()
                ? {
                    "font-bold text-orange-700":
                      activeStoryStore.activeStoryData()?.by ===
                      props.comment.by,
                    "font-medium":
                      activeStoryStore.activeStoryData()?.by !==
                      props.comment.by,
                  }
                : "font-normal"
            )}
          >
            {props.comment.by}
          </span>
          <Show when={isOpen()}>
            <span class="text-slate-300 select-none">|</span>
            <span>{timeSince(props.comment.time)}</span>
            <span class="text-slate-300 select-none">|</span>
            <button
              onClick={handleShareClick}
              class="text-slate-400 hover:text-orange-500"
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

          <Show when={childComments().length > 0}>
            <HnCommentList
              childComments={childComments()}
              depth={props.depth + 1}
              authorChain={[...props.authorChain, props.comment.by]}
            />
          </Show>
        </Show>
      </div>
    </Show>
  );
}
