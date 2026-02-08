// @refresh reload
import { createAsync } from "@solidjs/router";
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
import {
  type HnItem,
  type StoryPage,
  TopStoriesType,
} from "~/models/interfaces";
import { WithServerInfo } from "~/server/queries";
import { createErrorOverlayStore } from "~/stores/errorOverlay";
import { createLocalDataStore } from "~/stores/localDataStore";
import { createMessagesStore } from "~/stores/messages";
import { createServiceWorkerStatusStore } from "~/stores/serviceWorkerStatus";
import { createStoryUiStore } from "~/stores/storyUiStore";

import type { ContentForPage } from "~/stores/useDataStore";

type LocalDataStore = ReturnType<typeof createLocalDataStore>;

type AppDataContextValue = {
  messages: ReturnType<typeof createMessagesStore>;
  errorOverlay: ReturnType<typeof createErrorOverlayStore>;
  serviceWorker: ReturnType<typeof createServiceWorkerStatusStore>;
  localData: LocalDataStore;
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

  const readItems = localData.readItems;
  const refresh = localData.refresh;
  const data = localData.data;
  const comments = localData.comments;

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
        localData,
        readItems,
        refresh,
        data,
        comments,
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

export function useRelativeTimeTick() {
  return useAppData().relativeTimeTick;
}

export function useRelativeTime() {
  const relativeTimeTick = useRelativeTimeTick();

  return (date: number | undefined, addAgo: boolean = false) => {
    relativeTimeTick();
    return timeSince(date, addAgo);
  };
}

export function updateStoryListDataStores(
  page: TopStoriesType,
  data: StoryListResource
) {
  const dataStore = useDataStore();
  const refreshStore = useRefreshStore();
  const messagesStore = useMessagesStore();

  const p = page as StoryPage;
  const latest = data.latest;
  const d = latest?.result;

  if (latest?.startedFromServer && d?.type === "fullData") {
    refreshStore.setRefreshRequestedTimestamp(p);
    void dataStore.persistStoryList(p, d?.data ?? []);
  }

  dataStore.setRefreshType({
    type: "storyList",
    page: page as StoryPage,
  });

  messagesStore.addMessage("refresh", "setRefreshType", {
    page,
  });
}

type StoryListResult = WithServerInfo<ContentForPage>;
type StoryListResource = ReturnType<typeof createAsync<StoryListResult>>;

type StoryResult = WithServerInfo<HnItem | null | undefined>;
type StoryResource = ReturnType<typeof createAsync<StoryResult>>;

export function updateStoryDataStores(id: number, data: StoryResource) {
  const dataStore = useDataStore();
  const storyUiStore = useStoryUiStore();
  const story = data.latest?.result;

  if (!story) {
    return;
  }

  if (data.latest?.startedFromServer) {
    void dataStore.persistStoryToStorage(id, story);
  }

  storyUiStore.setActiveStoryData(story);
  dataStore.setRefreshType({ type: "story", id });
}
