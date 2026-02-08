import { createMemo, Show } from "solid-js";

import { Shell } from "~/components/Icon";
import {
  useDataStore,
  useRefreshStore,
  useRelativeTime,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";

import type { StoryPage, TopStoriesType } from "~/models/interfaces";

interface HnStoryListRefreshBarProps {
  page: TopStoriesType;
}

export function HnStoryListRefreshBar(props: HnStoryListRefreshBarProps) {
  const dataStore = useDataStore();
  const relativeTime = useRelativeTime();
  const refreshStore = useRefreshStore();
  const serviceWorker = useServiceWorkerStore();

  const isLoading = () => dataStore.isLoadingData();
  const onRefresh = () => dataStore.refreshActive();
  const isOffline = serviceWorker.isOfflineMode;

  const lastUpdatedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshStore.refreshTimestamps[page];
  });

  const lastRequestedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshStore.refreshRequestedTimestamps[page];
  });

  const pullMessage = createMemo(() => {
    return lastUpdatedTs()
      ? `Updated ${relativeTime(lastUpdatedTs(), true)}`
      : undefined;
  });

  const requestMessage = createMemo(() => {
    return lastRequestedTs()
      ? `Requested ${relativeTime(lastRequestedTs(), true)}`
      : undefined;
  });

  return (
    <Show when={pullMessage() || requestMessage()}>
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-slate-400">
        <button
          type="button"
          title="Refresh now"
          onClick={() => {
            if (isOffline() || isLoading()) {
              return;
            }
            onRefresh();
          }}
          class="inline-flex items-center gap-1 hover:text-orange-500 focus:outline-none active:text-orange-500"
          aria-label="Refresh list"
        >
          <span
            class={isLoading() ? "inline-flex animate-spin" : "inline-flex"}
          >
            <Shell width="12" height="12" />
          </span>
          <span>{pullMessage() ?? "Refresh"}</span>
        </button>
        <Show when={requestMessage()}>
          <button
            type="button"
            title="Refresh now"
            onClick={() => {
              if (isOffline() || isLoading()) {
                return;
              }
              onRefresh();
            }}
            class="text-[10px] text-slate-400 hover:text-orange-500 focus:outline-none active:text-orange-500"
            aria-label="Refresh list"
          >
            {requestMessage()}
          </button>
        </Show>
      </div>
    </Show>
  );
}
