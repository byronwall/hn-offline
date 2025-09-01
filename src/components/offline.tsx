import { A } from "@solidjs/router";
import { onMount } from "solid-js";

export default function Offline() {
  onMount(() => {
    console.log("*** Offline");
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
