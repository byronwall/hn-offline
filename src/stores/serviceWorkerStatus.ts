import { createEffect, createSignal } from "solid-js";

import type { AddMessage } from "./messages";

export type ServiceWorkerStatus =
  | "unsupported"
  | "registering"
  | "installing"
  | "active"
  | "update-pending"
  | "error";

const PRELOAD_RELOAD_KEY = "hn-preload-reload-at";

export function createServiceWorkerStatusStore(addMessage: AddMessage) {
  const [serviceWorkerStatus, setServiceWorkerStatus] =
    createSignal<ServiceWorkerStatus>("registering");
  const [serviceWorkerVersion, setServiceWorkerVersion] = createSignal<
    string | undefined
  >(undefined);
  const [isOfflineMode, setIsOfflineMode] = createSignal<boolean>(false);

  const initializeServiceWorker = () => {
    const cleanups: Array<() => void> = [];
    const listen = (
      target: EventTarget,
      type: string,
      handler: (event: Event) => void
    ) => {
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    };

    setIsOfflineMode(!navigator.onLine);
    listen(window, "online", () => setIsOfflineMode(false));
    listen(window, "offline", () => setIsOfflineMode(true));

    // After a deploy, an old page asks for chunks the server no longer has.
    // Reload once to get the new HTML; the timestamp stops a reload loop.
    listen(window, "vite:preloadError", (event) => {
      const last = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? 0);
      if (Date.now() - last > 10_000) {
        event.preventDefault();
        sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    });

    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) {
      setServiceWorkerStatus("unsupported");
      return () => cleanups.forEach((cleanup) => cleanup());
    }
    const sw = navigator.serviceWorker;
    const requestVersion = () =>
      sw.controller?.postMessage({ type: "GET_VERSION" });

    // A new worker means a new deploy: this page's code and server function
    // ids are stale. Reload, but only while the page is hidden, so a reader
    // is never yanked mid-thread. The first install (no old controller) also
    // fires controllerchange and needs no reload.
    let hadController = !!sw.controller;
    let reloadPending = false;
    listen(sw, "controllerchange", () => {
      if (hadController) {
        reloadPending = true;
        setServiceWorkerStatus("update-pending");
        if (document.visibilityState === "hidden") {
          window.location.reload();
        }
      }
      hadController = true;
      requestVersion();
    });

    listen(sw, "message", (event) => {
      const data = (event as MessageEvent).data as
        | { type?: string; version?: string }
        | undefined;
      if (data?.type === "SW_VERSION" && data.version) {
        setServiceWorkerVersion(data.version);
      }
    });

    void sw
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setServiceWorkerStatus(reg.active ? "active" : "installing");
        void sw.ready.then(() => {
          setServiceWorkerStatus((s) => (s === "installing" ? "active" : s));
          requestVersion();
        });

        // An installed PWA can stay open for days with no navigation, and
        // browsers check for a new worker only on navigation. Check each time
        // the app comes back to the front.
        listen(document, "visibilitychange", () => {
          if (document.visibilityState === "hidden" && reloadPending) {
            window.location.reload();
          } else if (document.visibilityState === "visible") {
            void reg.update().catch(() => {});
          }
        });
      })
      .catch((error: unknown) => {
        setServiceWorkerStatus("error");
        console.error("Service worker registration failed", error);
      });

    return () => cleanups.forEach((cleanup) => cleanup());
  };

  createEffect(() => {
    addMessage("swStatus", serviceWorkerStatus());
  });

  createEffect(() => {
    addMessage(
      "offline",
      isOfflineMode() ? "Entered offline mode" : "Exited offline mode"
    );
  });

  return {
    serviceWorkerStatus,
    serviceWorkerVersion,
    isOfflineMode,
    initializeServiceWorker,
  };
}
