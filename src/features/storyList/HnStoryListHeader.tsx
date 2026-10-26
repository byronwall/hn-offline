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

// One line above the list: last refresh time + refresh on the left, hide-read
// toggle on the right.
export function HnStoryListHeader(props: HnStoryListHeaderProps) {
  const dataStore = useDataStore();
  const readItemsStore = useReadItemsStore();
  const relativeTime = useRelativeTime();
  const refreshStore = useRefreshStore();
  const serviceWorker = useServiceWorkerStore();

  // When the client last got this list from the server.
  const refreshedTs = () =>
    refreshStore.refreshTimestamps[props.page as StoryPage];

  const hideRead = () => readItemsStore.readSettings.shouldHideReadItems;

  return (
    <div class="flex h-8 items-center justify-between gap-3 px-1 text-[13px] text-slate-500">
      <button
        type="button"
        title="Refresh now"
        disabled={serviceWorker.isOfflineMode() || dataStore.isLoadingData()}
        onClick={() => dataStore.refreshActive()}
        class="hover:text-hn-ink flex min-w-0 items-center gap-1.5 transition-colors duration-150 disabled:hover:text-slate-500"
      >
        <Shell
          width="14"
          height="14"
          class={cn("shrink-0", {
            "text-hn-ink animate-spin": dataStore.isLoadingData(),
          })}
        />
        <span class="truncate">
          <Show when={refreshedTs()} fallback="Refresh">
            {(ts) => <>Refreshed {relativeTime(ts(), true)}</>}
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
        <span class="peer-checked:bg-hn peer-focus-visible:ring-hn/40 relative h-4 w-7 rounded-full bg-slate-300 transition-colors duration-150 peer-focus-visible:ring-2 after:absolute after:top-0.5 after:left-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white dark:after:bg-slate-800 after:transition-transform after:duration-150 peer-checked:after:translate-x-3" />
      </label>
    </div>
  );
}
