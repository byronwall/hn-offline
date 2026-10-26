import { createEffect, createSignal } from "solid-js";

import type { AddMessage } from "./messages";

export type ServiceWorkerStatus =
  | "unsupported"
  | "registering"
  | "installing"
  | "installed"
  | "activating"
  | "active"
  | "controllerchanged"
  | "error";

export function createServiceWorkerStatusStore(addMessage: AddMessage) {
  const initialStatus: ServiceWorkerStatus =
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? "registering"
      : "unsupported";

  const [serviceWorkerStatus, setServiceWorkerStatus] =
    createSignal<ServiceWorkerStatus>(initialStatus);

  const [serviceWorkerVersion, setServiceWorkerVersion] = createSignal<
    string | undefined
  >(undefined);

  const [isOfflineMode, setIsOfflineMode] = createSignal<boolean>(false);

  const initializeServiceWorker = () => {
    const skipDev = import.meta.env.PROD;
    let cleanupServiceWorkerListeners: (() => void) | null = null;
    let cleanupOnlineListeners: (() => void) | null = null;

    if (typeof window === "undefined") {
      return () => {};
    }

    if ("serviceWorker" in navigator && skipDev) {
      let controllerChangeHandler: (() => void) | null = null;
      let messageHandler: ((event: MessageEvent) => void) | null = null;

      cleanupServiceWorkerListeners = () => {
        if (controllerChangeHandler) {
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            controllerChangeHandler
          );
        }
        if (messageHandler) {
          navigator.serviceWorker.removeEventListener(
            "message",
            messageHandler
          );
        }
      };

      void (async () => {
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

          // A new worker calls skipWaiting itself; this only tracks status.
          reg.addEventListener("updatefound", () => {
            const sw = reg.installing;
            if (!sw) {
              return;
            }
            setServiceWorkerStatus("installing");
            sw.addEventListener("statechange", () => {
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

          // The first install also fires controllerchange (clients.claim);
          // reload only when a new version replaces an old one.
          let hadController = !!navigator.serviceWorker.controller;
          const handleControllerChange = () => {
            setServiceWorkerStatus("controllerchanged");
            if (hadController) {
              window.location.reload();
            }
            hadController = true;
          };
          controllerChangeHandler = handleControllerChange;

          navigator.serviceWorker.addEventListener(
            "controllerchange",
            handleControllerChange
          );

          const handleMessage = (event: MessageEvent) => {
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
              default:
                break;
            }
          };
          messageHandler = handleMessage;

          navigator.serviceWorker.addEventListener("message", handleMessage);

          // Request SW version proactively once controlling or ready
          const requestVersion = () => {
            try {
              if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: "GET_VERSION",
                });
              }
            } catch (_) {
              // no-op
            }
          };

          if (navigator.serviceWorker.controller) {
            requestVersion();
          }
          navigator.serviceWorker.ready.then(requestVersion).catch(() => {});
        } catch (e) {
          setServiceWorkerStatus("error");
          // eslint-disable-next-line no-console
          console.error("Service worker registration failed", e);
        }
      })();
    } else {
      setServiceWorkerStatus("unsupported");
    }

    // Track browser online/offline to toggle offline mode
    try {
      const onlineHandler = () => setIsOfflineMode(false);
      const offlineHandler = () => setIsOfflineMode(true);

      // Initialize from current navigator state
      setIsOfflineMode(!navigator.onLine);
      window.addEventListener("online", onlineHandler);
      window.addEventListener("offline", offlineHandler);

      cleanupOnlineListeners = () => {
        window.removeEventListener("online", onlineHandler);
        window.removeEventListener("offline", offlineHandler);
      };
    } catch (_) {
      // no-op
    }

    return () => {
      cleanupServiceWorkerListeners?.();
      cleanupOnlineListeners?.();
    };
  };

  createEffect(() => {
    addMessage("swStatus", serviceWorkerStatus());
  });

  createEffect(() => {
    const offline = isOfflineMode();
    addMessage(
      "offline",
      offline ? "Entered offline mode" : "Exited offline mode"
    );
  });

  return {
    serviceWorkerStatus,
    serviceWorkerVersion,
    isOfflineMode,
    setServiceWorkerStatus,
    setServiceWorkerVersion,
    setIsOfflineMode,
    initializeServiceWorker,
  };
}
