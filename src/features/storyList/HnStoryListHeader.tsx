import { Show } from "solid-js";

import { Shell } from "~/components/Icon";
import {
  useDataStore,
  useReadItemsStore,
  useRefreshStore,
  useRelativeTime,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { cn } from "~/lib/utils";

import type { StoryPage, TopStoriesType } from "~/models/interfaces";

type HnStoryListHeaderProps = {
  page: TopStoriesType;
  hiddenCount: number;
};

// One line above the list: freshness + refresh on the left, hide-read toggle
// on the right.
export function HnStoryListHeader(props: HnStoryListHeaderProps) {
  const dataStore = useDataStore();
  const readItemsStore = useReadItemsStore();
  const relativeTime = useRelativeTime();
  const refreshStore = useRefreshStore();
  const serviceWorker = useServiceWorkerStore();

  const updatedTs = () =>
    refreshStore.refreshTimestamps[props.page as StoryPage];
  const requestedTs = () =>
    refreshStore.refreshRequestedTimestamps[props.page as StoryPage];
  // Only mention the last check when it found nothing newer.
  const checkedTs = () => {
    const requested = requestedTs();
    return requested && requested - (updatedTs() ?? 0) > 60
      ? requested
      : undefined;
  };

  const hideRead = () => readItemsStore.readSettings.shouldHideReadItems;

  return (
    <div class="flex h-8 items-center justify-between gap-3 px-1 text-[13px] text-slate-500">
      <button
        type="button"
        title="Refresh now"
        disabled={serviceWorker.isOfflineMode() || dataStore.isLoadingData()}
        onClick={() => dataStore.refreshActive()}
        class="flex min-w-0 items-center gap-1.5 transition-colors duration-150 hover:text-orange-700 disabled:hover:text-slate-500"
      >
        <Shell
          width="14"
          height="14"
          class={cn("shrink-0", {
            "animate-spin text-orange-500": dataStore.isLoadingData(),
          })}
        />
        <span class="truncate">
          <Show when={updatedTs()} fallback="Refresh">
            {(ts) => <>Updated {relativeTime(ts(), true)}</>}
          </Show>
          <Show when={checkedTs()}>
            {(ts) => (
              <span class="text-slate-400">
                {" "}
                · checked {relativeTime(ts(), true)}
              </span>
            )}
          </Show>
        </span>
      </button>

      <label class="flex shrink-0 cursor-pointer items-center gap-2 select-none">
        <span>
          Hide read
          <Show when={hideRead() && props.hiddenCount > 0}>
            <span class="text-slate-400"> ({props.hiddenCount})</span>
          </Show>
        </span>
        <input
          type="checkbox"
          class="peer sr-only"
          checked={hideRead()}
          onChange={(e) =>
            readItemsStore.setReadSettings(
              "shouldHideReadItems",
              e.currentTarget.checked
            )
          }
        />
        <span class="relative h-4 w-7 rounded-full bg-slate-300 transition-colors duration-150 peer-checked:bg-orange-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-300 after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform after:duration-150 peer-checked:after:translate-x-3" />
      </label>
    </div>
  );
}
