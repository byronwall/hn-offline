import { createSignal } from "solid-js";

import type { HnItem } from "~/models/interfaces";

export function createStoryUiStore() {
  const [activeStoryData, setActiveStoryData] = createSignal<
    HnItem | undefined
  >(undefined);

  const [colorMap, setColorMap] = createSignal<Record<string, string>>({});

  const [scrollToId, setScrollToId] = createSignal<number | undefined>(
    undefined
  );

  return {
    activeStoryData,
    setActiveStoryData,
    colorMap,
    setColorMap,
    scrollToId,
    setScrollToId,
    clearScrollToId: () => setScrollToId(undefined),
  };
}
