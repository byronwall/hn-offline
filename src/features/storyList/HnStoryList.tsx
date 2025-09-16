import { createMemo, createSignal, For, Show } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import { useSortFunction } from "~/hooks/useSortFunction";
import { createHasRendered } from "~/lib/createHasRendered";
import { timeSince } from "~/lib/utils";
import { HnStorySummary } from "~/models/interfaces";
import { isOfflineMode } from "~/stores/serviceWorkerStatus";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";
import {
  readItems,
  readSettings,
  recentlyReadId,
  setReadSettings,
  setRecentlyReadId,
} from "~/stores/useReadItemsStore";
import { refreshTimestamps } from "~/stores/useRefreshStore";

import { HnListItem } from "./HnListItem";

import type { StoryPage } from "~/models/interfaces";

interface HnStoryListProps {
  sortType?: "score";
  page?: StoryPage;
}

export const [activeStoryList, setActiveStoryList] = createSignal<
  HnStorySummary[]
>([]);

export function HnStoryList(props: HnStoryListProps) {
  const hasRendered = createHasRendered();

  // server will not have any stories to render since we rely on createEffect
  // render 0 here to avoid hydration mismatch
  const itemsToRender = () =>
    hasRendered()
      ? (useSortFunction(activeStoryList(), props.sortType) ?? [])
      : [];

  const lastUpdatedTs = createMemo(() => {
    const page = props.page;
    const fromRefreshStore =
      page && hasRendered() ? refreshTimestamps[page] : undefined;

    return fromRefreshStore;
  });

  const pullMessage = createMemo(() => {
    return lastUpdatedTs()
      ? `Updated ${timeSince(lastUpdatedTs(), true)}`
      : undefined;
  });

  const toggleHideReadItems = () => {
    setReadSettings("shouldHideReadItems", !readSettings.shouldHideReadItems);
  };

  return (
    <Show when={itemsToRender()} fallback={<div>Loading...</div>}>
      <Show
        when={itemsToRender().length > 0}
        fallback={
          <div class="text-center text-lg text-gray-500">
            No items to show. Most likely, you are filtering to hide read items.
            Click the toggle above to change the setting.
          </div>
        }
      >
        <PullToRefresh
          disabled={isLoadingData() || isOfflineMode()}
          onRefresh={refreshActive}
          // message={pullMessage()}
        >
          <Show when={pullMessage()}>
            <div class="text-center text-[11px] text-slate-400">
              {pullMessage()}
            </div>
          </Show>
          <div class="grid grid-cols-[1fr_1fr_1fr_3fr]">
            <For each={itemsToRender()}>
              {(item) => {
                const isRead = () => readItems[item.id] !== undefined;
                const isRecentRead = () => recentlyReadId() === item.id;
                const shouldRender = () =>
                  // allow SSR hydration match, or if not hiding read items
                  !hasRendered() ||
                  !readSettings.shouldHideReadItems ||
                  !isRead() ||
                  isRecentRead();

                return (
                  <Show when={shouldRender()}>
                    <HnListItem
                      data={item}
                      recentFadeOut={
                        isRecentRead() && readSettings.shouldHideReadItems
                      }
                      onFadeComplete={() => setRecentlyReadId(undefined)}
                    />
                  </Show>
                );
              }}
            </For>
          </div>
        </PullToRefresh>
      </Show>
      <div class="flex items-center gap-2 pt-8">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={readSettings.shouldHideReadItems}
            onChange={toggleHideReadItems}
            class="peer sr-only"
          />

          <div class="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-600 peer-focus:ring-4 peer-focus:ring-orange-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-orange-800" />

          <span>Hide read items</span>
        </label>
      </div>
    </Show>
  );
}
