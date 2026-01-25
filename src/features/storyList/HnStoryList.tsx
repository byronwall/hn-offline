import { createEffect, createMemo, For, Show } from "solid-js";

import { Shell } from "~/components/Icon";
import { PullToRefresh } from "~/components/PullToRefresh";
import {
  useMessagesStore,
  useReadItemsStore,
} from "~/contexts/AppDataContext";
import { useSortFunction } from "~/hooks/useSortFunction";
import { createHasRendered } from "~/lib/createHasRendered";
import { timeSince } from "~/lib/utils";
import { HnStorySummary } from "~/models/interfaces";

import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items?: HnStorySummary[];
  sortType?: "score";
  isLoading: boolean;
  isOffline: boolean;
  lastUpdatedTs?: number;
  lastRequestedTs?: number;
  onRefresh: () => Promise<void> | void;
}

export function HnStoryList(props: HnStoryListProps) {
  const messagesStore = useMessagesStore();
  const readItemsStore = useReadItemsStore();
  const hasRendered = createHasRendered();

  // server will not have any stories to render since we rely on createEffect
  // render 0 here to avoid hydration mismatch
  const itemsToRender = () => {
    if (!hasRendered()) {
      return [];
    }
    const items = props.items;
    if (!items) {
      return undefined;
    }
    return useSortFunction(items, props.sortType) ?? [];
  };

  const lastUpdatedTs = createMemo(() => {
    return props.lastUpdatedTs;
  });

  const pullMessage = createMemo(() => {
    return lastUpdatedTs()
      ? `Updated ${timeSince(lastUpdatedTs(), true)}`
      : undefined;
  });

  const requestMessage = createMemo(() => {
    return props.lastRequestedTs
      ? `Requested ${timeSince(props.lastRequestedTs, true)}`
      : undefined;
  });

  createEffect(() => {
    if (!hasRendered()) {
      return;
    }
    messagesStore.addMessage("storyList", "props updated", {
      count: props.items?.length ?? 0,
      lastUpdatedTs: props.lastUpdatedTs,
      lastRequestedTs: props.lastRequestedTs,
      isLoading: props.isLoading,
      isOffline: props.isOffline,
      pullMessage: pullMessage(),
      requestMessage: requestMessage(),
    });
  });

  const toggleHideReadItems = () => {
    readItemsStore.setReadSettings(
      "shouldHideReadItems",
      !readItemsStore.readSettings.shouldHideReadItems
    );
  };

  return (
    <Show when={itemsToRender()} fallback={<div>Loading...</div>}>
      <Show
        when={(itemsToRender() ?? []).length > 0}
        fallback={
          <div class="text-center text-lg text-gray-500">
            No items to show. Most likely, you are filtering to hide read items.
            Click the toggle above to change the setting.
          </div>
        }
      >
        <PullToRefresh
          disabled={props.isLoading || props.isOffline}
          onRefresh={props.onRefresh}
          // message={pullMessage()}
        >
          <Show when={pullMessage() || requestMessage()}>
            <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11px] text-slate-400">
              <button
                type="button"
                title="Refresh now"
                onClick={() => {
                  if (props.isOffline || props.isLoading) {
                    return;
                  }
                  props.onRefresh();
                }}
                class="inline-flex items-center gap-1 hover:text-orange-500 focus:outline-none active:text-orange-500"
                aria-label="Refresh list"
              >
                <span
                  class={
                    props.isLoading ? "inline-flex animate-spin" : "inline-flex"
                  }
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
                    if (props.isOffline || props.isLoading) {
                      return;
                    }
                    props.onRefresh();
                  }}
                  class="text-[10px] text-slate-400 hover:text-orange-500 focus:outline-none active:text-orange-500"
                  aria-label="Refresh list"
                >
                  {requestMessage()}
                </button>
              </Show>
            </div>
          </Show>
          <div class="grid grid-cols-[1fr_1fr_1fr_3fr]">
            <For each={itemsToRender() ?? []}>
              {(item) => {
                const isRead = () => readItemsStore.readItems[item.id] !== undefined;
                const isRecentRead = () => readItemsStore.recentlyReadId() === item.id;
                const shouldRender = () =>
                  // allow SSR hydration match, or if not hiding read items
                  !hasRendered() ||
                  !readItemsStore.readSettings.shouldHideReadItems ||
                  !isRead() ||
                  isRecentRead();

                return (
                  <Show when={shouldRender()}>
                    <HnListItem
                      data={item}
                      recentFadeOut={
                        isRecentRead() && readItemsStore.readSettings.shouldHideReadItems
                      }
                      onFadeComplete={() => readItemsStore.setRecentlyReadId(undefined)}
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
            checked={readItemsStore.readSettings.shouldHideReadItems}
            onChange={toggleHideReadItems}
            class="peer sr-only"
          />

          <div class="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-orange-600 peer-focus:ring-4 peer-focus:ring-orange-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-orange-800" />

          <span>
            {readItemsStore.readSettings.shouldHideReadItems
              ? "Hiding read items (click to show)"
              : "Showing read items (click to hide)"}
          </span>
        </label>
      </div>
    </Show>
  );
}
