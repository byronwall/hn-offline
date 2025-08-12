// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

mount(() => <StartClient />, document.getElementById("app")!);

// register PWA service worker
// manual registration because file is not in expected path
// Dockerfile moves it to /public/sw.js from /public/_build/sw.js
// app entry (e.g., src/main.ts or main.jsx)
if ("serviceWorker" in navigator) {
  (async () => {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // Optional: prompt flow (replace with your toast UI)
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) {
        return;
      }
      sw.addEventListener("statechange", () => {
        const isUpdate =
          sw.state === "installed" && navigator.serviceWorker.controller;
        if (isUpdate) {
          // Auto-activate; or show a toast and do this on confirm:
          sw.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // New SW has taken control — reload to pick up fresh HTML/asset graph
      window.location.reload();
    });
  })();
}
