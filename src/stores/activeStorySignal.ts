import { createSignal } from "solid-js";

import type { HnItem } from "~/models/interfaces";

export const [activeStoryData, setActiveStoryData] = createSignal<
  HnItem | undefined
>(undefined);
