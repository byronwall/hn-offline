import { Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import {
  useColorMapStore,
  useCommentStore,
  useScrollStore,
} from "~/contexts/AppDataContext";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { cn, getDomain, shareSafely, timeSince } from "~/lib/utils";

import type { HnItem } from "~/models/interfaces";

type HnStoryContentCardProps = {
  story?: HnItem | undefined;
  firstCommentId?: number;
};

export const HnStoryContentCard = (props: HnStoryContentCardProps) => {
  const colorMapStore = useColorMapStore();
  const commentStore = useCommentStore();
  const scrollStore = useScrollStore();

  const author = () => props.story?.by;
  const score = () => props.story?.score;
  const time = () => props.story?.time;
  const url = () => props.story?.url;
  const hasText = () => props.story?.text !== undefined;
  const storyId = () => props.story?.id;
  const textHtml = () =>
    processHtmlAndTruncateAnchorText(props.story?.text || "");
  const flashColor = () =>
    colorMapStore.colorMap()[author() ?? ""] ?? "hsl(30, 80%, 65%)";

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
        scrollStore.setScrollToId(props.firstCommentId);
      }
    }, 100);
  }

  const handleShareClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    await shareSafely({ url: window.location.href });
  };

  return (
    <div
      class={cn(
        {
          "rounded-tl pr-2 pl-4": hasText(),
          collapsed: !isTextOpen(),
        },
        "bp3-card user-text"
      )}
      onClick={handleStoryTextClick}
      style={{
        "--flash-color": flashColor(),
        "padding-left": "16px",
      }}
    >
      <div class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-slate-700">
        <span class="font-medium">{author()}</span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span>
          {score()}
          {" points"}
        </span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span>{timeSince(time())}</span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span class="truncate font-mono text-[14px] text-slate-600">
          {getDomain(url())}
        </span>

        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <button
          onClick={handleShareClick}
          class="text-slate-400 hover:text-orange-500"
          aria-label="Share"
        >
          <ArrowUpRightFromSquare width={16} height={16} />
        </button>
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
