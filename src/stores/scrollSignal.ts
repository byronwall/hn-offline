import { createSignal } from "solid-js";

const [scrollToId, setScrollToIdSignal] = createSignal<number | undefined>(
  undefined
);

export const scrollToIdSignal = scrollToId;
export const setScrollToId = setScrollToIdSignal;
export const clearScrollToId = () => setScrollToIdSignal(undefined);
