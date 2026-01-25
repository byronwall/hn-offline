import { Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { cn, getDomain, shareSafely, timeSince } from "~/lib/utils";

type HnStoryContentCardProps = {
  author?: string;
  score?: number;
  time?: number;
  url?: string;
  textHtml: string;
  hasText: boolean;
  isTextOpen: boolean;
  flashColor: string;
  onToggleText: () => void;
};

export const HnStoryContentCard = (props: HnStoryContentCardProps) => {
  const handleShareClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    await shareSafely({ url: window.location.href });
  };

  return (
    <div
      class={cn(
        {
          "rounded-tl pr-2 pl-4": props.hasText,
          collapsed: !props.isTextOpen,
        },
        "bp3-card"
      )}
      onClick={() => props.onToggleText()}
      style={{
        "--flash-color": props.flashColor,
        "padding-left": "16px",
      }}
    >
      <div class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-slate-700">
        <span class="font-medium">{props.author}</span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span>
          {props.score}
          {" points"}
        </span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span>{timeSince(props.time)}</span>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
        <span class="truncate font-mono text-[14px] text-slate-600">
          {getDomain(props.url)}
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

      <Show when={props.hasText && props.isTextOpen}>
        <div>
          {/*  eslint-disable-next-line solid/no-innerhtml */}
          <p class="user-text break-words" innerHTML={props.textHtml} />
        </div>
      </Show>
    </div>
  );
};
