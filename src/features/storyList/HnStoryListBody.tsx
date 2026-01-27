import { createAutoAnimate } from "@formkit/auto-animate/solid";
import { createMemo, Show } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import { useDataStore } from "~/contexts/AppDataContext";
import { useSortFunction } from "~/hooks/useSortFunction";

import { HnStoryListItems } from "./HnStoryListItems";
import { HnStoryListRefreshBar } from "./HnStoryListRefreshBar";

import type { HnStorySummary, TopStoriesType } from "~/models/interfaces";

interface HnStoryListBodyProps {
  items?: (HnStorySummary | null | undefined)[];
  page: TopStoriesType;
}

export function HnStoryListBody(props: HnStoryListBodyProps) {
  const dataStore = useDataStore();
  const [listParent] = createAutoAnimate();
  const isLoading = () => dataStore.isLoadingData();
  const onRefresh = () => dataStore.refreshActive();
  const isStorySummary = (
    item: HnStorySummary | null | undefined
  ): item is HnStorySummary => !!item && typeof item.id === "number";

  // server will not have any stories to render since we rely on createEffect
  // render 0 here to avoid hydration mismatch
  const itemsToRender = createMemo(() => {
    const items = props.items?.filter(isStorySummary);
    if (!items) {
      return undefined;
    }
    const sortType = props.page === "topstories" ? undefined : "score";
    return useSortFunction(items, sortType) ?? [];
  });

  return (
    <Show
      when={(itemsToRender() ?? []).length > 0}
      fallback={
        <div class="text-center text-lg text-gray-500">
          No items to show. Most likely, you are filtering to hide read items.
          Click the toggle above to change the setting.
        </div>
      }
    >
      <PullToRefresh disabled={isLoading()} onRefresh={onRefresh}>
        <HnStoryListRefreshBar page={props.page} />
        <div class="grid grid-cols-[1fr_1fr_1fr_3fr]" ref={listParent}>
          <HnStoryListItems items={itemsToRender() ?? []} />
        </div>
      </PullToRefresh>
    </Show>
  );
}
