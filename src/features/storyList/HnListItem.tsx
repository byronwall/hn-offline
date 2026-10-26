import { A } from "@solidjs/router";
import { Show } from "solid-js";

import { ChevronUp, MessageSquareQuote } from "~/components/Icon";
import { useReadItemsStore, useRelativeTime } from "~/contexts/AppDataContext";
import { cn, getDomain } from "~/lib/utils";
import { HnStorySummary } from "~/models/interfaces";

type HnListItemProps = {
  data: HnStorySummary;
  rank: number;
  recentFadeOut?: boolean;
  onFadeComplete?: () => void;
};

export function HnListItem(props: HnListItemProps) {
  const readItemsStore = useReadItemsStore();
  const relativeTime = useRelativeTime();

  const storyHref = () => "/story/" + props.data.id;
  const isRead = () => readItemsStore.readItems[props.data.id] !== undefined;
  const newComments = () =>
    readItemsStore.newCommentCount(props.data.id, props.data.descendants);
  const domain = () => getDomain(props.data.url)?.replace(/^www\./, "");

  const handleAnimationEnd = () => {
    if (props.recentFadeOut) {
      props.onFadeComplete?.();
    }
  };

  return (
    <div
      class={cn({ "row-leave": props.recentFadeOut })}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* min-h-0 wrapper lets .row-leave shrink the row past its padding */}
      <div class="min-h-0">
        <div class="flex gap-2 py-1.5">
          <span class="w-7 shrink-0 pt-px text-right text-[15px] text-slate-400 tabular-nums">
            {props.rank}.
          </span>
          <div class="min-w-0 flex-1">
            <p
              class={cn(
                "track-visited leading-snug font-medium hover:underline",
                isRead() ? "text-slate-400" : "text-slate-900"
              )}
            >
              <Show
                when={props.data.url}
                fallback={<A href={storyHref()}>{props.data.title}</A>}
              >
                {(url) => (
                  <a href={url()} target="_blank" rel="noreferrer">
                    {props.data.title}
                  </a>
                )}
              </Show>
            </p>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 text-[15px] text-slate-500">
              <span class="flex items-center gap-0.5 tabular-nums">
                <ChevronUp width="16" height="16" class="stroke-slate-400" />
                {props.data.score}
              </span>
              <A
                href={storyHref()}
                class="-my-1 flex items-center gap-1 py-1 tabular-nums transition-colors duration-150 hover:text-orange-700"
                aria-label={`${props.data.descendants ?? 0} comments`}
              >
                <MessageSquareQuote
                  width="16"
                  height="16"
                  class="stroke-slate-400"
                />
                {props.data.descendants ?? 0}
                <Show when={newComments() > 0}>
                  <span class="font-medium text-orange-700">
                    +{newComments()} new
                  </span>
                </Show>
              </A>
              <span>{relativeTime(props.data.time)}</span>
              <Show when={domain()}>
                <span class="min-w-0 truncate text-slate-400">{domain()}</span>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
