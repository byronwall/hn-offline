import { Show } from "solid-js";

import { Shell } from "~/components/Icon";
import {
  useDataStore,
  useRefreshStore,
  useRelativeTime,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { cn } from "~/lib/utils";

import type { StoryPage, TopStoriesType } from "~/models/interfaces";

interface HnStoryListRefreshBarProps {
  page: TopStoriesType;
}

export function HnStoryListRefreshBar(props: HnStoryListRefreshBarProps) {
  const dataStore = useDataStore();
  const relativeTime = useRelativeTime();
  const refreshStore = useRefreshStore();
  const serviceWorker = useServiceWorkerStore();

  const updatedTs = () =>
    refreshStore.refreshTimestamps[props.page as StoryPage];
  const requestedTs = () =>
    refreshStore.refreshRequestedTimestamps[props.page as StoryPage];

  const canRefresh = () =>
    !serviceWorker.isOfflineMode() && !dataStore.isLoadingData();

  return (
    <Show when={updatedTs() || requestedTs()}>
      <button
        type="button"
        title="Refresh now"
        aria-label="Refresh list"
        disabled={!canRefresh()}
        onClick={() => dataStore.refreshActive()}
        class="mx-auto flex w-fit items-center gap-1 py-1 text-[11px] text-slate-400 hover:text-orange-500 focus:outline-none focus-visible:text-orange-500 disabled:hover:text-slate-400"
      >
        <span
          class={cn("inline-flex", {
            "animate-spin": dataStore.isLoadingData(),
          })}
        >
          <Shell width="12" height="12" />
        </span>
        <Show when={updatedTs()} fallback="Refresh">
          {(ts) => <span>Updated {relativeTime(ts(), true)}</span>}
        </Show>
        <Show when={requestedTs()}>
          {(ts) => (
            <span class="text-slate-300">
              · requested {relativeTime(ts(), true)}
            </span>
          )}
        </Show>
      </button>
    </Show>
  );
}
