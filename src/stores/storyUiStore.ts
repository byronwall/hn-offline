import { createSelector, createSignal } from "solid-js";

import type { HnItem } from "~/models/interfaces";

export function createStoryUiStore() {
  const [activeStoryData, setActiveStoryData] = createSignal<
    HnItem | undefined
  >(undefined);

  const [colorMap, setColorMap] = createSignal<Record<string, string>>({});

  const [scrollToId, setScrollToId] = createSignal<number | undefined>(
    undefined
  );

  // Each comment checks only its own id, so a new target wakes one comment
  // instead of every comment on the page.
  const isScrollTarget = createSelector(scrollToId);

  return {
    activeStoryData,
    setActiveStoryData,
    colorMap,
    setColorMap,
    isScrollTarget,
    setScrollToId,
    clearScrollToId: () => setScrollToId(undefined),
  };
}
