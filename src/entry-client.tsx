// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { mount, StartClient } from "@solidjs/start/client";

import { setIsOnline, setupNetworkListeners } from "./stores/networkStatus";
import {
  setServiceWorkerStatus,
  setServiceWorkerVersion,
} from "./stores/serviceWorkerStatus";

mount(
  () => (
    <MetaProvider>
      <StartClient />
    </MetaProvider>
  ),
  document.getElementById("app")!
);

// // Initialize network online/offline listeners and initial state
setupNetworkListeners();
if (typeof navigator !== "undefined") {
  setIsOnline(navigator.onLine);
}

// // register PWA service worker
// // manual registration because file is not in expected path
// // Dockerfile moves it to /public/sw.js from /public/_build/sw.js
// // app entry (e.g., src/main.ts or main.jsx)

const skipDev = import.meta.env.PROD || true;

if ("serviceWorker" in navigator && skipDev) {
  (async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      setServiceWorkerStatus("registering");

      // If an active worker already exists (e.g., after reload), mark active immediately
      if (reg.active || navigator.serviceWorker.controller) {
        setServiceWorkerStatus("active");
      }

      // Ensure we mark active as soon as the SW is ready/controlling
      navigator.serviceWorker.ready
        .then(() => setServiceWorkerStatus("active"))
        .catch(() => {});

      // Optional: prompt flow (replace with your toast UI)
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) {
          return;
        }
        setServiceWorkerStatus("installing");
        sw.addEventListener("statechange", () => {
          const isUpdate =
            sw.state === "installed" && navigator.serviceWorker.controller;
          if (isUpdate) {
            // Auto-activate; or show a toast and do this on confirm:
            sw.postMessage({ type: "SKIP_WAITING" });
          }
          if (sw.state === "installed") {
            setServiceWorkerStatus("installed");
          }
          if (sw.state === "activating") {
            setServiceWorkerStatus("activating");
          }
          if (sw.state === "activated") {
            setServiceWorkerStatus("active");
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // New SW has taken control — reload to pick up fresh HTML/asset graph
        setServiceWorkerStatus("controllerchanged");
        window.location.reload();
      });

      navigator.serviceWorker.addEventListener("message", (event) => {
        const data = event.data as
          | { type?: string; version?: string; online?: boolean }
          | undefined;
        if (!data || typeof data !== "object") {
          return;
        }
        switch (data.type) {
          case "SW_READY":
            setServiceWorkerStatus("active");
            break;
          case "SW_VERSION":
            if (data.version) {
              setServiceWorkerVersion(data.version);
            }
            break;
          case "NETWORK_STATUS":
            if (typeof data.online === "boolean") {
              setIsOnline(data.online);
            }
            break;
          default:
            break;
        }
      });
    } catch (e) {
      setServiceWorkerStatus("error");
      // eslint-disable-next-line no-console
      console.error("Service worker registration failed", e);
    }
  })();
} else {
  setServiceWorkerStatus("unsupported");
}
