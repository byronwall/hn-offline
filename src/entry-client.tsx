// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import { registerSW } from "virtual:pwa-register";

mount(() => <StartClient />, document.getElementById("app")!);

// register PWA service worker
// manual registration because file is not in expected path
// Dockerfile moves it to /public/sw.js from /public/_build/sw.js
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((registration) => {
//         // registration worked
//         console.log("Registration succeeded.");
//         registration.update();
//       })
//       .catch((error) => {
//         // registration failed
//         console.error(`Registration failed with ${error}`);
//       });
//   });
// }

// register PWA service worker
registerSW({ immediate: true });
