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

import {
  type HnItem,
  type StoryPage,
  TopStoriesType,
} from "~/models/interfaces";
import { WithServerInfo } from "~/server/queries";
import { createErrorOverlayStore } from "~/stores/errorOverlay";
import { createLocalForageStore } from "~/stores/localforage";
import { createMessagesStore } from "~/stores/messages";
import { createServiceWorkerStatusStore } from "~/stores/serviceWorkerStatus";
import { createStoryUiStore } from "~/stores/storyUiStore";
import { createCommentStore } from "~/stores/useCommentStore";
import { createDataStore } from "~/stores/useDataStore";
import { createReadItemsStore } from "~/stores/useReadItemsStore";
import { createRefreshStore } from "~/stores/useRefreshStore";

import type { ErrorOverlayStore } from "~/stores/errorOverlay";
import type { MessagesStore } from "~/stores/messages";
import type { ServiceWorkerStore } from "~/stores/serviceWorkerStatus";
import type { StoryUiStore } from "~/stores/storyUiStore";
import type { CommentStore } from "~/stores/useCommentStore";
import type { ContentForPage, DataStore } from "~/stores/useDataStore";
import type { ReadItemsStore } from "~/stores/useReadItemsStore";
import type { RefreshStore } from "~/stores/useRefreshStore";

type AppDataContextValue = {
  messages: MessagesStore;
  errorOverlay: ErrorOverlayStore;
  serviceWorker: ServiceWorkerStore;
  readItems: ReadItemsStore;
  refresh: RefreshStore;
  data: DataStore;
  comments: CommentStore;
  storyUi: StoryUiStore;
  isClientMounted: Accessor<boolean>;
};

const AppDataContext = createContext<AppDataContextValue>();

export function AppDataProvider(props: ParentProps) {
  const messages = createMessagesStore();
  const errorOverlay = createErrorOverlayStore();
  const localForage = createLocalForageStore(messages.addMessage);
  const serviceWorker = createServiceWorkerStatusStore(messages.addMessage);
  const storyUi = createStoryUiStore();

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
    storyUi,
  });
  const comments = createCommentStore({
    addMessage: messages.addMessage,
    localForage: localForage.localForage,
    storyUi,
  });

  onMount(() => {
    errorOverlay.attachGlobalErrorHandlers();
    localForage.initializeLocalForage();
    const cleanupServiceWorker = serviceWorker.initializeServiceWorker();
    onCleanup(() => {
      cleanupServiceWorker();
    });
  });

  return (
    <AppDataContext.Provider
      value={{
        messages,
        errorOverlay,
        serviceWorker,
        readItems,
        refresh,
        data,
        comments,
        storyUi,
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
  if (latest?.startedFromServer && d && Array.isArray(d)) {
    console.log("*** persisting story list", p, d.length);
    void dataStore.persistStoryList(p, d);
  }

  dataStore.setRefreshType({
    type: "storyList",
    page: page as StoryPage,
  });

  messagesStore.addMessage("refresh", "setRefreshType", {
    page,
  });

  refreshStore.setRefreshRequestedTimestamp(p);
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
