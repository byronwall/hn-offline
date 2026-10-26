import { createMemo, createSignal } from "solid-js";

import { getColorsForStory } from "~/lib/getColorsForStory";

import type { HnItem } from "~/models/interfaces";

// UI state for the open story page.
export function createStoryUiStore() {
  const [activeStoryData, setActiveStoryData] = createSignal<
    HnItem | undefined
  >(undefined);

  // Author colors for the open story; comments read this for their accent.
  const colorMap = createMemo(() => {
    const story = activeStoryData();
    return story ? getColorsForStory(story) : {};
  });

  // When the reader last opened this story (ms), to mark newer comments.
  const [lastVisitMs, setLastVisitMs] = createSignal<number | undefined>(
    undefined
  );

  return {
    activeStoryData,
    setActiveStoryData,
    colorMap,
    lastVisitMs,
    setLastVisitMs,
  };
}
