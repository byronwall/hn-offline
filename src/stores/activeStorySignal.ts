import { createSignal } from "solid-js";

import type { HnItem } from "~/models/interfaces";

const [activeStoryData, setActiveStoryData] = createSignal<HnItem | undefined>(
  undefined
);

export { activeStoryData, setActiveStoryData };
