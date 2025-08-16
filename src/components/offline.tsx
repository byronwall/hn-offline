import { onMount } from "solid-js";

export default function Offline() {
  onMount(() => {
    console.log("*** Offline");
  });

  return <div>Offline Shell</div>;
}
