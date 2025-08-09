import { For, Show } from "solid-js";

import { useSortFunction } from "~/hooks/useSortFunction";
import { createHasRendered } from "~/lib/createHasRendered";
import { HnStorySummary } from "~/models/interfaces";
import { StoryPage } from "~/stores/useDataStore";
import { readItems, shouldHideReadItems } from "~/stores/useReadItemsStore";

import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items?: HnStorySummary[];
  sortType?: "score" | "read-then-points";
  page?: StoryPage;
}

export function HnStoryList(props: HnStoryListProps) {
  const itemsToRender = () =>
    useSortFunction(props.items, props.sortType) ?? [];

  const hasRendered = createHasRendered();

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
      </Show>
    </Show>
  );
}
