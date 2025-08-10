// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import { registerSW } from "virtual:pwa-register";

/* reconcile SW

// load service worker @ sw.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // registration worked
        console.log("Registration succeeded.");
        registration.update();
      })
      .catch((error) => {
        // registration failed
        console.error(`Registration failed with ${error}`);
      });
  });
}

*/

mount(() => <StartClient />, document.getElementById("app")!);

// register PWA service worker
registerSW({ immediate: true });
