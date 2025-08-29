import { createEffect, createSignal, For, Show } from "solid-js";

import { useSortFunction } from "~/hooks/useSortFunction";
import { createHasRendered } from "~/lib/createHasRendered";
import { HnStorySummary } from "~/models/interfaces";
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

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = createSignal(0);
  const [isPulling, setIsPulling] = createSignal(false);
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  let startY = 0;
  const ACTIVATION_THRESHOLD = 64; // px

  const onTouchStart = (ev: TouchEvent) => {
    if (typeof window === "undefined") {
      return;
    }
    if (isLoadingData() || isRefreshing()) {
      return;
    }
    // Only enable when at top of the page
    if (window.scrollY > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    startY = ev.touches[0]?.clientY ?? 0;
    setIsPulling(true);
    setPullDistance(0);
  };

  const onTouchMove = (ev: TouchEvent) => {
    if (!isPulling()) {
      return;
    }
    const currentY = ev.touches[0]?.clientY ?? 0;
    const delta = currentY - startY;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    // Apply a little resistance
    const damped = Math.min(160, delta * 0.5);
    setPullDistance(damped);
  };

  const onTouchEnd = async () => {
    if (!isPulling()) {
      return;
    }
    const shouldRefresh =
      pullDistance() >= ACTIVATION_THRESHOLD && !isLoadingData();
    setIsPulling(false);
    if (shouldRefresh) {
      setIsRefreshing(true);
      // Haptics if available
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          (
            navigator as unknown as {
              vibrate: (p: number | number[]) => boolean;
            }
          ).vibrate(20);
        }
      } catch (_err) {
        /* noop */
      }
      await refreshActive();
    }
    setPullDistance(0);
  };

  createEffect(() => {
    if (!isLoadingData() && isRefreshing()) {
      setIsRefreshing(false);
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
        {/* Pull-to-refresh surface */}
        <div
          class="w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          style={{ "touch-action": "pan-x" }}
        >
          {/* Indicator */}
          <div
            class="flex items-center justify-center text-sm text-slate-500 transition-[height] duration-150 ease-out select-none"
            style={{ height: `${pullDistance()}px` }}
          >
            <Show when={pullDistance() > 0}>
              <span>
                {pullDistance() >= ACTIVATION_THRESHOLD
                  ? "Release to refresh"
                  : "Pull to refresh"}
              </span>
            </Show>
          </div>

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
        </div>
      </Show>
      <div class="flex items-center gap-2">
        <label class="inline-flex items-center cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={shouldHideReadItems()}
            onChange={toggleHideReadItems}
            class="peer sr-only"
          />

          <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600" />

          <span class="text-sm">Hide read items</span>
        </label>
      </div>
    </Show>
  );
}
