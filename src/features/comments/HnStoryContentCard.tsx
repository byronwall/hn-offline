import { Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { useColorMapStore } from "~/contexts/AppDataContext";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { cn, getDomain, shareSafely, timeSince } from "~/lib/utils";

import type { HnItem } from "~/models/interfaces";

type HnStoryContentCardProps = {
  story?: HnItem | undefined;
  isTextOpen: boolean;
  onToggleText: () => void;
};

export const HnStoryContentCard = (props: HnStoryContentCardProps) => {
  const colorMapStore = useColorMapStore();

  const author = () => props.story?.by;
  const score = () => props.story?.score;
  const time = () => props.story?.time;
  const url = () => props.story?.url;
  const hasText = () => props.story?.text !== undefined;
  const textHtml = () =>
    processHtmlAndTruncateAnchorText(props.story?.text || "");
  const flashColor = () =>
    colorMapStore.colorMap()[author() ?? ""] ?? "hsl(30, 80%, 65%)";

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
          collapsed: !props.isTextOpen,
        },
        "bp3-card"
      )}
      onClick={() => props.onToggleText()}
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

      <Show when={hasText() && props.isTextOpen}>
        <div>
          {/*  eslint-disable-next-line solid/no-innerhtml */}
          <p class="user-text break-words" innerHTML={textHtml()} />
        </div>
      </Show>
    </div>
  );
};
