import { For, Show } from "solid-js";

import { useReadItemsStore } from "~/contexts/AppDataContext";

import { HnListItem } from "./HnListItem";

import type { HnStorySummary } from "~/models/interfaces";

interface HnStoryListItemsProps {
  items: HnStorySummary[];
}

export function HnStoryListItems(props: HnStoryListItemsProps) {
  const readItemsStore = useReadItemsStore();

  return (
    <For each={props.items}>
      {(item) => {
        const isRead = () =>
          readItemsStore.readItems[item.id] !== undefined;
        const isRecentRead = () => readItemsStore.recentlyReadId() === item.id;
        const shouldRender = () =>
          // allow SSR hydration match, or if not hiding read items
          !readItemsStore.readSettings.shouldHideReadItems ||
          !isRead() ||
          isRecentRead();

        return (
          <Show when={shouldRender()}>
            <HnListItem
              data={item}
              recentFadeOut={
                isRecentRead() &&
                readItemsStore.readSettings.shouldHideReadItems
              }
              onFadeComplete={() =>
                readItemsStore.setRecentlyReadId(undefined)
              }
            />
          </Show>
        );
      }}
    </For>
  );
}
