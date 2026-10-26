import { type Accessor, createSignal } from "solid-js";

import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { fetchObjById } from "~/lib/getContentViaFetch";
import {
  fetchAllStoryDataForPage,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { scrollToY } from "~/lib/scroll";
import { validateHnItemWithComments } from "~/lib/validation";
import { HnItem, HnStorySummary } from "~/models/interfaces";

import { createPersistedStore } from "./createPersistedStore";
import { withRetries } from "./withRetries";

import type { AddMessage } from "./messages";
import type { createStoryUiStore } from "./storyUiStore";
import type { ReadItemsStore } from "./useReadItemsStore";
import type { createRefreshStore } from "./useRefreshStore";
import type { StoryPage } from "~/models/interfaces";
import type { WithServerInfo } from "~/server/queries";

export type StoryId = number;

type PersistedStoryList = {
  serverUpdateTimestamp: number;
  page: StoryPage;
  data: HnStorySummary[];
};

type StoryListStore = Record<StoryPage, PersistedStoryList>;

export type ContentForPage =
  | {
      type: "summaryOnly";
      data: HnStorySummary[];
    }
  | {
      type: "fullData";
      data: HnItem[];
    };

type RefreshType =
  | {
      type: "storyList";
      page: StoryPage;
    }
  | {
      type: "story";
      id: StoryId;
    };

export function createDataStore(params: {
  addMessage: AddMessage;
  localForage: Accessor<LocalForage | undefined>;
  readItemsStore: ReadItemsStore;
  refreshStore: ReturnType<typeof createRefreshStore>;
  storyUi: ReturnType<typeof createStoryUiStore>;
}) {
  const retry = <T>(operationName: string, operation: () => Promise<T>) =>
    withRetries(operation, (attempt, delayMs) => {
      params.addMessage("localforage", `${operationName} retry`, {
        attempt,
        delayMs,
      });
    });

  const safeGetItem = async <T>(key: string): Promise<T | undefined> => {
    try {
      const value = await retry(
        "getItem",
        async () => await params.localForage()?.getItem<T>(key)
      );
      return value ?? undefined;
    } catch (error) {
      console.error("*** localForage getItem failed", { key, error });
      params.addMessage("localforage", "getItem failed", { key });
      return undefined;
    }
  };

  const safeSetItem = async <T>(key: string, value: T): Promise<boolean> => {
    try {
      await retry("setItem", async () => {
        await params.localForage()?.setItem(key, value);
      });
      return true;
    } catch (error) {
      console.error("*** localForage setItem failed", { key, error });
      params.addMessage("localforage", "setItem failed", { key });
      return false;
    }
  };

  const safeRemoveItem = async (key: string): Promise<void> => {
    try {
      await retry("removeItem", async () => {
        await params.localForage()?.removeItem(key);
      });
    } catch (error) {
      console.error("*** localForage removeItem failed", { key, error });
      params.addMessage("localforage", "removeItem failed", { key });
    }
  };

  const [storyListStore, setStoryListStore] = createPersistedStore(
    "STORY_LIST_STORE",
    {} as StoryListStore,
    params.localForage
  );

  const didStoryListChange = (
    current: PersistedStoryList | undefined,
    next: HnStorySummary[]
  ) => {
    if (!current) {
      return true;
    }

    if (current.data.length !== next.length) {
      return true;
    }

    return next.some((item, index) => {
      const existing = current.data[index];
      if (!existing) {
        return true;
      }

      return (
        existing.id !== item.id || existing.lastUpdated !== item.lastUpdated
      );
    });
  };

  // Save the list of summaries shown on a list page, if it is new.
  const saveListSummaries = async (
    page: StoryPage,
    storySummaries: HnStorySummary[]
  ) => {
    if (storySummaries.length === 0) {
      return;
    }

    const current = storyListStore[page];
    const incomingTimestamp = Math.max(
      ...storySummaries.map((item) => item.lastUpdated ?? 0),
      0
    );

    const shouldOverwrite =
      !current ||
      incomingTimestamp > (current.serverUpdateTimestamp ?? 0) ||
      didStoryListChange(current, storySummaries);

    if (shouldOverwrite) {
      // save if none or if the incoming timestamp is newer
      params.addMessage("persist", "persistStoryList over store", {
        page,
        incomingTimestamp,
        currentTimestamp: current?.serverUpdateTimestamp,
      });
      await setStoryListStore(page, {
        serverUpdateTimestamp: incomingTimestamp,
        page,
        data: storySummaries,
      });
      params.refreshStore.setRefreshTimestamp(page);
    }
  };

  // Save a list page and every full story on it for offline reading.
  const persistStoryList = async (page: StoryPage, data: HnItem[]) => {
    params.addMessage("persist", "persistStoryList init", {
      page,
      count: data.length,
    });

    await saveListSummaries(page, mapStoriesToSummaries(data) ?? []);

    // Persist raw items individually for detail pages, in parallel.
    const validItems = data.filter((item) => {
      const isValid = validateHnItemWithComments(item);
      if (!isValid.success) {
        console.error("invalid item", { error: isValid.error, item });
      }
      return isValid.success;
    });
    const saved = await Promise.all(
      validItems.map((item) => persistStoryToStorage(item.id, item))
    );
    const skippedSaves = saved.filter((didSave) => !didSave).length;

    params.addMessage("persist", "persistStoryList done", {
      page,
      persisted: data.length,
      skippedSaves,
    });
  };

  // Remove stories that are not in current lists or recently read
  const purgeLocalForage = async () => {
    params.addMessage("purge", "purgeLocalForage init");

    const idsToKeep = new Set<number>();
    for (const page in storyListStore) {
      const persistedList = storyListStore[page as StoryPage];

      for (const item of persistedList.data) {
        idsToKeep.add(item.id);
      }
    }

    // Collect IDs from the READ_ITEMS store (recently read)
    for (const idStr of Object.keys(params.readItemsStore.readItems)) {
      const id = Number(idStr);
      if (!Number.isNaN(id)) {
        idsToKeep.add(id);
      }
    }

    let keys: string[] | undefined;
    try {
      keys = await retry(
        "keys",
        async () => await params.localForage()?.keys()
      );
    } catch (error) {
      console.error("*** localForage keys failed", { error });
      params.addMessage("localforage", "keys failed");
    }

    if (!keys) {
      return;
    }

    // Remove legacy/accidental keys that contain a slash
    const badKeys = keys.filter((key) => key.includes("/"));
    for (const key of badKeys) {
      await safeRemoveItem(key);
    }

    // Optionally remove old list keys from previous versions
    const legacyListKeys = keys.filter((key) => key.startsWith("STORIES_"));
    for (const key of legacyListKeys) {
      await safeRemoveItem(key);
    }

    // Delete any raw_* entries that are not in idsToKeep
    const rawKeys = keys.filter((key) => key.startsWith("raw_"));
    for (const key of rawKeys) {
      const id = Number(key.replace("raw_", ""));
      if (!idsToKeep.has(id)) {
        await safeRemoveItem(key);
      }
    }

    params.addMessage("purge", "purgeLocalForage done");
  };

  const persistStoryToStorage = async (id: StoryId, content: HnItem) => {
    // attempt to load item, only save if lastUpdated is newer
    const storageKey = "raw_" + id;
    const currentItem = await safeGetItem<HnItem>(storageKey);

    if (currentItem && currentItem.lastUpdated >= content.lastUpdated) {
      return false;
    }

    return safeSetItem(storageKey, content);
  };

  const getContent = async (
    id: StoryId,
    options?: { allowNetwork?: boolean }
  ) => {
    const item = await safeGetItem<HnItem>("raw_" + id);

    if (item) {
      params.addMessage("getContent", "found item in localforage", { id });
      return item;
    }

    if (options?.allowNetwork === false) {
      return undefined;
    }

    // Offline or a bad id: show "not available" instead of crashing the route.
    try {
      return await fetchObjById(id, {
        addMessage: params.addMessage,
        persistStoryToStorage,
      });
    } catch (error) {
      console.error("getContent failed", { id, error });
      return undefined;
    }
  };

  const [isLoadingData, setIsLoadingData] = createSignal(false);

  const getContentForPage = async (
    rawPage: string
  ): Promise<ContentForPage> => {
    params.addMessage("getContentForPage", "init", { rawPage });

    const page = convertPathToStoryPage(rawPage);

    const list = storyListStore[page as StoryPage];

    if (list) {
      params.addMessage("getContentForPage", "found list in store", { page });
      return { type: "summaryOnly", data: list.data };
    }

    params.refreshStore.setRefreshRequestedTimestamp(page);

    const data = await fetchAllStoryDataForPage(page, {
      addMessage: params.addMessage,
      persistStoryList,
    });

    return { type: "fullData", data };
  };

  const [refreshType, setRefreshType] = createSignal<RefreshType | undefined>(
    undefined
  );

  const refreshActive = async () => {
    params.addMessage("refreshActive", "refreshActive", {
      refreshType: refreshType(),
    });

    const type = refreshType();
    if (!type) {
      return;
    }

    // Every refresh starts the reader at the top.
    scrollToY(0);

    setIsLoadingData(true);

    try {
      if (type.type === "storyList") {
        params.addMessage("refresh", "refreshRequested init", {
          page: type.page,
        });
        params.refreshStore.setRefreshRequestedTimestamp(type.page);
        params.addMessage("refresh", "refreshRequested", { page: type.page });
        const pageData = await fetchAllStoryDataForPage(type.page, {
          force: true,
          addMessage: params.addMessage,
          persistStoryList,
        });
        const summaries = mapStoriesToSummaries(pageData) ?? [];
        params.addMessage("refresh", "refreshFetched", {
          page: type.page,
          count: summaries.length,
        });
      } else if (type.type === "story") {
        const storyData = await fetchObjById(type.id, {
          force: true,
          addMessage: params.addMessage,
          persistStoryToStorage,
        });
        params.storyUi.setActiveStoryData(storyData);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  // Called by the list route whenever its data settles.
  const syncStoryList = (
    page: StoryPage,
    latest: WithServerInfo<ContentForPage> | undefined
  ) => {
    setRefreshType({ type: "storyList", page });
    if (!latest?.startedFromServer) {
      return;
    }

    // SSR ships summaries only, to keep the HTML small. Show them now, then
    // fetch the full stories in the background for offline reading.
    params.refreshStore.setRefreshRequestedTimestamp(page);
    void saveListSummaries(
      page,
      mapStoriesToSummaries(latest.result.data) ?? []
    );
    void fetchAllStoryDataForPage(page, {
      addMessage: params.addMessage,
      persistStoryList,
    });
  };

  // Called by the story route whenever its data settles.
  const syncStory = (
    id: StoryId,
    latest: WithServerInfo<HnItem | null | undefined> | undefined
  ) => {
    const story = latest?.result;
    if (!story) {
      return;
    }
    if (latest.startedFromServer) {
      void persistStoryToStorage(id, story);
    }
    params.storyUi.setActiveStoryData(story);
    setRefreshType({ type: "story", id });
  };

  return {
    storyListStore,
    isLoadingData,
    syncStoryList,
    syncStory,
    persistStoryList,
    persistStoryToStorage,
    purgeLocalForage,
    getContent,
    getContentForPage,
    refreshActive,
  };
}
