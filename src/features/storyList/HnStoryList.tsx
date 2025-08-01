import { For, onMount, Show } from "solid-js";

import { useSortFunction } from "~/hooks/useSortFunction";
import { HnStorySummary, StoryPage, useDataStore } from "~/stores/useDataStore";

import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items?: HnStorySummary[];
  sortType?: "score" | "read-then-points";
  page?: StoryPage;
}

export function HnStoryList(props: HnStoryListProps) {
  const itemsToRender = () =>
    useSortFunction(props.items, props.sortType) ?? [];

  const initializeLocalStorage = useDataStore(
    (s) => s.initializeFromLocalForage
  );

  const saveStoryList = useDataStore((s) => s.saveStoryList);

  onMount(async () => {
    // client only
    if (typeof window === "undefined") {
      console.log("HnStoryList mounted, but not on client");
      return;
    }

    console.log("HnStoryList mounted on client");
    await initializeLocalStorage();
    if (props.page) {
      await saveStoryList(props.page, props.items ?? []);
    }
  });

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
        <div>
          <div class="grid grid-cols-[1fr_1fr_1fr_3fr]">
            <For each={itemsToRender()}>
              {(item) => <HnListItem data={item} />}
            </For>
          </div>
        </div>
      </Show>
    </Show>
  );
}
