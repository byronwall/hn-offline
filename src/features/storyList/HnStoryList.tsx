import { createSignal, For, Show } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import { useSortFunction } from "~/hooks/useSortFunction";
import { createHasRendered } from "~/lib/createHasRendered";
import { HnStorySummary } from "~/models/interfaces";
import { isLoadingData, StoryPage } from "~/stores/useDataStore";
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
          <div class="text-center text-gray-500 text-lg">
            No items to show. Most likely, you are filtering to hide read items.
            Click the toggle above to change the setting.
          </div>
        }
      >
        <PullToRefresh disabled={isLoadingData()}>
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
        <label class="inline-flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={shouldHideReadItems()}
            onChange={toggleHideReadItems}
            class="peer sr-only"
          />

          <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600" />

          <span>Hide read items</span>
        </label>
      </div>
    </Show>
  );
}
