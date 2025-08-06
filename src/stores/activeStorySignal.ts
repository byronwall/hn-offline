import { createSignal } from "solid-js";

import type { HnItem } from "./useDataStore";

const [activeStoryData, setActiveStoryData] = createSignal<HnItem | undefined>(
  undefined
);

export { activeStoryData, setActiveStoryData };
