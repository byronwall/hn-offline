// @refresh reload
import {
  Accessor,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  type ParentProps,
  useContext,
} from "solid-js";
import { isServer } from "solid-js/web";

import { createActiveStoryStore } from "~/stores/activeStorySignal";
import { createColorMapStore } from "~/stores/colorMap";
import { createErrorOverlayStore } from "~/stores/errorOverlay";
import { createLocalForageStore } from "~/stores/localforage";
import { createMessagesStore } from "~/stores/messages";
import { createScrollStore } from "~/stores/scrollSignal";
import { createServiceWorkerStatusStore } from "~/stores/serviceWorkerStatus";
import { createCommentStore } from "~/stores/useCommentStore";
import { createDataStore } from "~/stores/useDataStore";
import { createReadItemsStore } from "~/stores/useReadItemsStore";
import { createRefreshStore } from "~/stores/useRefreshStore";

import type { ActiveStoryStore } from "~/stores/activeStorySignal";
import type { ColorMapStore } from "~/stores/colorMap";
import type { ErrorOverlayStore } from "~/stores/errorOverlay";
import type { LocalForageStore } from "~/stores/localforage";
import type { MessagesStore } from "~/stores/messages";
import type { ScrollStore } from "~/stores/scrollSignal";
import type { ServiceWorkerStore } from "~/stores/serviceWorkerStatus";
import type { CommentStore } from "~/stores/useCommentStore";
import type { DataStore } from "~/stores/useDataStore";
import type { ReadItemsStore } from "~/stores/useReadItemsStore";
import type { RefreshStore } from "~/stores/useRefreshStore";

type AppDataContextValue = {
  messages: MessagesStore;
  errorOverlay: ErrorOverlayStore;
  localForage: LocalForageStore;
  serviceWorker: ServiceWorkerStore;
  readItems: ReadItemsStore;
  refresh: RefreshStore;
  data: DataStore;
  comments: CommentStore;
  scroll: ScrollStore;
  activeStory: ActiveStoryStore;
  colorMap: ColorMapStore;
  isClientMounted: Accessor<boolean>;
};

const AppDataContext = createContext<AppDataContextValue>();

let atom = 1;

export function AppDataProvider(props: ParentProps) {
  console.log("*** AppDataProvider", { atom });
  atom++;
  const messages = createMessagesStore();
  const errorOverlay = createErrorOverlayStore();
  const localForage = createLocalForageStore(messages.addMessage);
  const serviceWorker = createServiceWorkerStatusStore(messages.addMessage);
  const scroll = createScrollStore();
  const activeStory = createActiveStoryStore();
  const colorMap = createColorMapStore();

  console.log("*** AppDataProvider", { localForage });

  // non-reactive flag to track if the client has been mounted
  // consumers can check this but it's not reactive ON PURPOSE
  const [isClientMounted, setIsClientMounted] = createSignal(false);
  onMount(() => {
    setIsClientMounted(true);
  });

  const readItems = createReadItemsStore(
    messages.addMessage,
    localForage.localForage
  );

  const refresh = createRefreshStore(
    messages.addMessage,
    localForage.localForage
  );
  const data = createDataStore({
    addMessage: messages.addMessage,
    localForage: localForage.localForage,
    readItemsStore: readItems,
    refreshStore: refresh,
    activeStoryStore: activeStory,
  });
  const comments = createCommentStore({
    addMessage: messages.addMessage,
    localForage: localForage.localForage,
    activeStory,
    scroll,
  });

  onMount(() => {
    console.log("*** AppDataProvider onMount");
    errorOverlay.attachGlobalErrorHandlers();
    localForage.initializeLocalForage();

    const skipDev = import.meta.env.PROD;
    let cleanupServiceWorkerListeners: (() => void) | null = null;
    let cleanupOnlineListeners: (() => void) | null = null;

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
          const reg = await navigator.serviceWorker.register("/_build/sw.js", {
            scope: "/",
          });

          serviceWorker.setServiceWorkerStatus("registering");

          // If an active worker already exists (e.g., after reload), mark active immediately
          if (reg.active || navigator.serviceWorker.controller) {
            serviceWorker.setServiceWorkerStatus("active");
          }

          // Ensure we mark active as soon as the SW is ready/controlling
          navigator.serviceWorker.ready
            .then(() => serviceWorker.setServiceWorkerStatus("active"))
            .catch(() => {});

          // Optional: prompt flow (replace with your toast UI)
          reg.addEventListener("updatefound", () => {
            const sw = reg.installing;
            if (!sw) {
              return;
            }
            serviceWorker.setServiceWorkerStatus("installing");
            sw.addEventListener("statechange", () => {
              const isUpdate =
                sw.state === "installed" && navigator.serviceWorker.controller;
              if (isUpdate) {
                // Auto-activate; or show a toast and do this on confirm:
                sw.postMessage({ type: "SKIP_WAITING" });
              }
              if (sw.state === "installed") {
                serviceWorker.setServiceWorkerStatus("installed");
              }
              if (sw.state === "activating") {
                serviceWorker.setServiceWorkerStatus("activating");
              }
              if (sw.state === "activated") {
                serviceWorker.setServiceWorkerStatus("active");
              }
            });
          });

          const handleControllerChange = () => {
            // New SW has taken control — reload to pick up fresh HTML/asset graph
            serviceWorker.setServiceWorkerStatus("controllerchanged");
            window.location.reload();
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
                serviceWorker.setServiceWorkerStatus("active");
                break;
              case "SW_VERSION":
                if (data.version) {
                  serviceWorker.setServiceWorkerVersion(data.version);
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
          serviceWorker.setServiceWorkerStatus("error");
          // eslint-disable-next-line no-console
          console.error("Service worker registration failed", e);
        }
      })();
    } else {
      serviceWorker.setServiceWorkerStatus("unsupported");
    }

    // Track browser online/offline to toggle offline mode
    try {
      if (typeof window !== "undefined") {
        const onlineHandler = () => serviceWorker.setIsOfflineMode(false);
        const offlineHandler = () => serviceWorker.setIsOfflineMode(true);

        // Initialize from current navigator state
        serviceWorker.setIsOfflineMode(!navigator.onLine);
        window.addEventListener("online", onlineHandler);
        window.addEventListener("offline", offlineHandler);

        cleanupOnlineListeners = () => {
          window.removeEventListener("online", onlineHandler);
          window.removeEventListener("offline", offlineHandler);
        };
      }
    } catch (_) {
      // no-op
    }

    onCleanup(() => {
      cleanupServiceWorkerListeners?.();
      cleanupOnlineListeners?.();
    });
  });

  console.log("*** AppDataProvider returning", {
    isServer,
    localForage: localForage.localForage(),
  });

  return (
    <AppDataContext.Provider
      value={{
        messages,
        errorOverlay,
        localForage,
        serviceWorker,
        readItems,
        refresh,
        data,
        comments,
        scroll,
        activeStory,
        colorMap,
        isClientMounted,
      }}
    >
      {props.children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}

export function useMessagesStore() {
  return useAppData().messages;
}

export function useErrorOverlay() {
  return useAppData().errorOverlay;
}

export function useLocalForageStore() {
  return useAppData().localForage;
}

export function useServiceWorkerStore() {
  return useAppData().serviceWorker;
}

export function useReadItemsStore() {
  return useAppData().readItems;
}

export function useRefreshStore() {
  return useAppData().refresh;
}

export function useDataStore() {
  return useAppData().data;
}

export function useCommentStore() {
  return useAppData().comments;
}

export function useScrollStore() {
  return useAppData().scroll;
}

export function useActiveStoryStore() {
  return useAppData().activeStory;
}

export function useColorMapStore() {
  return useAppData().colorMap;
}
