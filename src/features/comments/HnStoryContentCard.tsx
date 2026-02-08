import { Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import {
  useCommentStore,
  useRelativeTime,
  useStoryUiStore,
} from "~/contexts/AppDataContext";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { shareHnTextContent } from "~/lib/shareHnTextContent";
import { cn } from "~/lib/utils";

import type { HnItem } from "~/models/interfaces";

type HnStoryContentCardProps = {
  story?: HnItem | undefined;
  firstCommentId?: number;
};

export const HnStoryContentCard = (props: HnStoryContentCardProps) => {
  const commentStore = useCommentStore();
  const relativeTime = useRelativeTime();
  const storyUiStore = useStoryUiStore();

  const author = () => props.story?.by;
  const time = () => props.story?.time;
  const hasText = () => props.story?.text !== undefined;
  const storyId = () => props.story?.id;
  const textHtml = () =>
    processHtmlAndTruncateAnchorText(props.story?.text || "");
  const flashColor = () =>
    storyUiStore.colorMap()[author() ?? ""] ?? "hsl(30, 80%, 65%)";

  const isTextOpen = () => {
    if (storyId() === undefined) {
      return true;
    }
    return commentStore.collapsedTimestamps[storyId()!] === undefined;
  };

  function handleStoryTextClick() {
    if (!props.story?.text || storyId() === undefined) {
      return;
    }

    const newIsCollapsed = !!isTextOpen();
    commentStore.updateCollapsedState(storyId()!, newIsCollapsed);

    // scroll to first comment if it exists
    // schedule out 200ms to allow the collapse animation to finish
    setTimeout(() => {
      if (newIsCollapsed && props.firstCommentId) {
        storyUiStore.setScrollToId(props.firstCommentId);
      }
    }, 100);
  }

  const handleShareClick = async (e: MouseEvent) => {
    e.stopPropagation();

    if (!props.story?.id) {
      return;
    }

    await shareHnTextContent({
      contentLabel: "Story",
      contentId: props.story.id,
      author: props.story.by,
      contentHtml: props.story.text || "",
      storyId: props.story.id,
      storyExternalUrl: props.story.url,
    });
  };

  return (
    <div
      class={cn(
        {
          "rounded-tl pr-2 pl-4": hasText(),
          collapsed: !isTextOpen(),
        },
        "bp3-card group flex flex-col gap-1"
      )}
      onClick={handleStoryTextClick}
      style={{
        "--flash-color": flashColor(),
        "padding-left": "16px",
      }}
    >
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-slate-700">
        <span class="font-medium">{author()}</span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span>{relativeTime(time())}</span>
        <Show when={hasText() && isTextOpen()}>
          <button
            onClick={handleShareClick}
            class="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-orange-500 [@media(hover:none)]:opacity-100"
            aria-label="Share"
          >
            <ArrowUpRightFromSquare width={16} />
          </button>
        </Show>
      </div>

      <Show when={hasText() && isTextOpen()}>
        <div>
          {/*  eslint-disable-next-line solid/no-innerhtml */}
          <p class="user-text break-words" innerHTML={textHtml()} />
        </div>
      </Show>
    </div>
  );
};
