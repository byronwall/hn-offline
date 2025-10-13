import { createSignal } from "solid-js";

export const [colorMap, setColorMap] = createSignal<Record<string, string>>({});
