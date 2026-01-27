import { type Accessor, createSignal } from "solid-js";

import type { HnItem } from "~/models/interfaces";

export type StoryUiStore = {
  activeStoryData: Accessor<HnItem | undefined>;
  setActiveStoryData: (story: HnItem | undefined) => void;
  colorMap: Accessor<Record<string, string>>;
  setColorMap: (map: Record<string, string>) => void;
  scrollToId: Accessor<number | undefined>;
  setScrollToId: (id: number | undefined) => void;
  clearScrollToId: () => void;
};

export function createStoryUiStore(): StoryUiStore {
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
