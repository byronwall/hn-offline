import { createSignal, onMount } from "solid-js";

export function createHasRendered() {
  // this is key to determine when a <Show> should trigger based on client only info
  // need to get at least 1 "same as server" render before hiding things in client
  // compared to React, it's possible for client info to be resolved before first render
  const [hasRendered, setHasRendered] = createSignal(false);
  onMount(() => {
    setHasRendered(true);
  });
  return hasRendered;
}
