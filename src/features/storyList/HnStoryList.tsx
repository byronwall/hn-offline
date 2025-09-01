import { createSignal, For, Show } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import { useSortFunction } from "~/hooks/useSortFunction";
import { createHasRendered } from "~/lib/createHasRendered";
import { HnStorySummary } from "~/models/interfaces";
import { isOfflineMode } from "~/stores/serviceWorkerStatus";
import { isLoadingData, refreshActive, StoryPage } from "~/stores/useDataStore";
import {
  readItems,
  setShouldHideReadItems,
  shouldHideReadItems,
} from "~/stores/useReadItemsStore";

import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  sortType?: "score" | "read-then-points";
  page?: StoryPage;
}

export const [activeStoryList, setActiveStoryList] = createSignal<
  HnStorySummary[]
>([]);

export function HnStoryList(props: HnStoryListProps) {
  const itemsToRender = () =>
    useSortFunction(activeStoryList(), props.sortType) ?? [];

  const hasRendered = createHasRendered();

  const toggleHideReadItems = () => {
    setShouldHideReadItems(!shouldHideReadItems());
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
        >
          <div class="grid grid-cols-[1fr_1fr_1fr_3fr]">
            <For each={itemsToRender()}>
              {(item) => (
                <Show
                  when={
                    // this allows client state to vary from server state so need to guard
                    // TODO: extract a common comp that handles this ShowIfRendered scenario
                    !hasRendered() ||
                    !shouldHideReadItems() ||
                    readItems[item.id] === undefined
                  }
                >
                  <HnListItem data={item} />
                </Show>
              )}
            </For>
          </div>
        </PullToRefresh>
      </Show>
      <div class="flex items-center gap-2 pt-8">
        <label class="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={shouldHideReadItems()}
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
