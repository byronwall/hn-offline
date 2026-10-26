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

import { timeSince } from "~/lib/utils";
import { createErrorOverlayStore } from "~/stores/errorOverlay";
import { createLocalDataStore } from "~/stores/localDataStore";
import { createMessagesStore } from "~/stores/messages";
import { createServiceWorkerStatusStore } from "~/stores/serviceWorkerStatus";
import { createStoryUiStore } from "~/stores/storyUiStore";

type LocalDataStore = ReturnType<typeof createLocalDataStore>;

type AppDataContextValue = {
  messages: ReturnType<typeof createMessagesStore>;
  errorOverlay: ReturnType<typeof createErrorOverlayStore>;
  serviceWorker: ReturnType<typeof createServiceWorkerStatusStore>;
  readItems: LocalDataStore["readItems"];
  refresh: LocalDataStore["refresh"];
  data: LocalDataStore["data"];
  comments: LocalDataStore["comments"];
  storyUi: ReturnType<typeof createStoryUiStore>;

  isClientMounted: Accessor<boolean>;
  relativeTimeTick: Accessor<number>;
};

const AppDataContext = createContext<AppDataContextValue>();

export function AppDataProvider(props: ParentProps) {
  const messages = createMessagesStore();
  const errorOverlay = createErrorOverlayStore();
  const serviceWorker = createServiceWorkerStatusStore(messages.addMessage);
  const storyUi = createStoryUiStore();
  const localData = createLocalDataStore({
    addMessage: messages.addMessage,
    storyUi,
  });

  const [isClientMounted, setIsClientMounted] = createSignal(false);
  const [relativeTimeTick, setRelativeTimeTick] = createSignal(0);
  onMount(() => {
    setIsClientMounted(true);
    setRelativeTimeTick(Date.now());
  });

  onMount(() => {
    errorOverlay.attachGlobalErrorHandlers();
    localData.initializeLocalForage();
    const cleanupServiceWorker = serviceWorker.initializeServiceWorker();
    const bumpRelativeTimeTick = () => {
      setRelativeTimeTick(Date.now());
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        bumpRelativeTimeTick();
      }
    };

    window.addEventListener("focus", bumpRelativeTimeTick);
    window.addEventListener("pageshow", bumpRelativeTimeTick);
    document.addEventListener("visibilitychange", onVisibilityChange);

    onCleanup(() => {
      window.removeEventListener("focus", bumpRelativeTimeTick);
      window.removeEventListener("pageshow", bumpRelativeTimeTick);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cleanupServiceWorker();
    });
  });

  return (
    <AppDataContext.Provider
      value={{
        messages,
        errorOverlay,
        serviceWorker,
        readItems: localData.readItems,
        refresh: localData.refresh,
        data: localData.data,
        comments: localData.comments,
        storyUi,
        isClientMounted,
        relativeTimeTick,
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

export function useStoryUiStore() {
  return useAppData().storyUi;
}

// Relative times ("5min") re-render when the app regains focus.
export function useRelativeTime() {
  const relativeTimeTick = useAppData().relativeTimeTick;

  return (date: number | undefined, addAgo: boolean = false) => {
    relativeTimeTick();
    return timeSince(date, addAgo);
  };
}
