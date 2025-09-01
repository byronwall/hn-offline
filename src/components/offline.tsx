import { A } from "@solidjs/router";
import { onMount } from "solid-js";

import { addMessage } from "~/stores/messages";

export default function Offline() {
  onMount(() => {
    addMessage("Offline", "Loading offline shell");
  });

  return (
    <div>
      Offline Shell
      <A href="/">Home</A>
      <A href="/day">Day</A>
      <A href="/week">Week</A>
      <A href="/offline">Offline</A>
    </div>
  );
}
