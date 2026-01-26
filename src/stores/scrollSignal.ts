import { createSignal } from "solid-js";

export type ScrollStore = {
  scrollToId: () => number | undefined;
  setScrollToId: (id: number | undefined) => void;
  clearScrollToId: () => void;
};

export function createScrollStore(): ScrollStore {
  const [scrollToId, setScrollToId] = createSignal<number | undefined>(
    undefined
  );

  return {
    scrollToId,
    setScrollToId,
    clearScrollToId: () => setScrollToId(undefined),
  };
}
