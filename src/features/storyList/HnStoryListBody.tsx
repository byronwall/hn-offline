import { createAutoAnimate } from "@formkit/auto-animate/solid";
import { createMemo, For, Match, Switch } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import { useDataStore, useReadItemsStore } from "~/contexts/AppDataContext";

import { HnListItem } from "./HnListItem";
import { HnStoryListRefreshBar } from "./HnStoryListRefreshBar";

import type { HnStorySummary, TopStoriesType } from "~/models/interfaces";

interface HnStoryListBodyProps {
  items: HnStorySummary[];
  page: TopStoriesType;
  loading: boolean;
}

export function HnStoryListBody(props: HnStoryListBodyProps) {
  const dataStore = useDataStore();
  const readItemsStore = useReadItemsStore();
  const [listParent] = createAutoAnimate();

  const hideRead = () => readItemsStore.readSettings.shouldHideReadItems;
  const isRead = (id: number) => readItemsStore.readItems[id] !== undefined;

  // Sort, then drop read stories when hiding them. The story just read stays
  // long enough to fade out.
  const visibleItems = createMemo(() => {
    const items =
      props.page === "topstories"
        ? props.items
        : props.items.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    if (!hideRead()) {
      return items;
    }
    const recentId = readItemsStore.recentlyReadId();
    return items.filter((item) => !isRead(item.id) || item.id === recentId);
  });

  const hiddenCount = () => props.items.length - visibleItems().length;

  return (
    <PullToRefresh
      disabled={dataStore.isLoadingData()}
      onRefresh={dataStore.refreshActive}
    >
      <HnStoryListRefreshBar page={props.page} />
      <Switch>
        <Match when={props.items.length === 0}>
          <p class="py-16 text-center text-gray-500">
            {props.loading
              ? "Loading stories…"
              : "No stories yet. Pull down or tap refresh to try again."}
          </p>
        </Match>
        <Match when={visibleItems().length === 0}>
          <div class="flex flex-col items-center gap-2 py-16 text-center text-gray-500">
            <p>You have read all {hiddenCount()} stories on this page.</p>
            <button
              type="button"
              class="text-orange-700 hover:underline"
              onClick={() =>
                readItemsStore.setReadSettings("shouldHideReadItems", false)
              }
            >
              Show read stories
            </button>
          </div>
        </Match>
      </Switch>
      <div class="grid grid-cols-[1fr_1fr_1fr_3fr]" ref={listParent}>
        <For each={visibleItems()}>
          {(item) => (
            <HnListItem
              data={item}
              recentFadeOut={
                hideRead() && readItemsStore.recentlyReadId() === item.id
              }
              onFadeComplete={() => readItemsStore.setRecentlyReadId(undefined)}
            />
          )}
        </For>
      </div>
    </PullToRefresh>
  );
}
