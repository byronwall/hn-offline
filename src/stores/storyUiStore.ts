import { createMemo, createSelector, createSignal } from "solid-js";

import { getColorsForStory } from "~/lib/getColorsForStory";

import type { HnItem } from "~/models/interfaces";

export function createStoryUiStore() {
  const [activeStoryData, setActiveStoryData] = createSignal<
    HnItem | undefined
  >(undefined);

  // Author colors for the open story; comments read this for their accent.
  const colorMap = createMemo(() => {
    const story = activeStoryData();
    return story ? getColorsForStory(story) : {};
  });

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
    isScrollTarget,
    setScrollToId,
    clearScrollToId: () => setScrollToId(undefined),
  };
}
