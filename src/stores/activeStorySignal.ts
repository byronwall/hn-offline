import { createSignal } from "solid-js";

import type { HnItem } from "~/models/interfaces";

export type ActiveStoryStore = {
  activeStoryData: () => HnItem | undefined;
  setActiveStoryData: (story: HnItem | undefined) => void;
};

export function createActiveStoryStore(): ActiveStoryStore {
  const [activeStoryData, setActiveStoryData] = createSignal<
    HnItem | undefined
  >(undefined);

  return {
    activeStoryData,
    setActiveStoryData,
  };
}
