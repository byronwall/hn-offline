import { type Accessor, createSignal } from "solid-js";

import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { fetchObjById } from "~/lib/getContentViaFetch";
import {
  fetchAllStoryDataForPage,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { validateHnItemWithComments } from "~/lib/validation";
import { HnItem, HnStorySummary } from "~/models/interfaces";

import { createPersistedStore } from "./createPersistedStore";

import type { AddMessage } from "./messages";
import type { createStoryUiStore } from "./storyUiStore";
import type { ReadItemsStore } from "./useReadItemsStore";
import type { createRefreshStore } from "./useRefreshStore";
import type { StoryPage } from "~/models/interfaces";

export type StoryId = number;

type PersistedStoryList = {
  serverUpdateTimestamp: number;
  page: StoryPage;
  data: HnStorySummary[];
};

export type StoryListStore = Record<StoryPage, PersistedStoryList>;

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
  const wait = (delayMs: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });

  const withLocalForageRetries = async <T>(
    operationName: string,
    operation: () => Promise<T>,
    maxAttempts = 3
  ): Promise<T> => {
    let latestError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        latestError = error;
        if (attempt >= maxAttempts) {
          break;
        }
        const delayMs = 250 * 2 ** (attempt - 1);
        params.addMessage("localforage", `${operationName} retry`, {
          attempt,
          delayMs,
        });
        await wait(delayMs);
      }
    }

    throw latestError;
  };

  const safeGetItem = async <T>(key: string): Promise<T | undefined> => {
    try {
      const value = await withLocalForageRetries(
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
      await withLocalForageRetries("setItem", async () => {
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
      await withLocalForageRetries("removeItem", async () => {
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

  const persistStoryList = async (page: StoryPage, data: HnItem[]) => {
    // overall goals: update store -> saves list to local forage
    // then go through all items and save them to local forage
    params.addMessage("persist", "persistStoryList init", {
      page,
      count: data.length,
    });

    // Do not persist if provided list is empty
    if (!data || data.length === 0) {
      params.addMessage("persist", "persistStoryList skip empty list", {
        page,
      });
      return;
    }

    // Map raw items to summaries for list storage
    const storySummaries = mapStoriesToSummaries(data);

    console.log("*** storySummaries", storySummaries);

    if (!storySummaries) {
      throw new Error("storySummaries is undefined");
    }

    const current = storyListStore[page];
    if (storySummaries.length === 0 && (current?.data?.length ?? 0) > 0) {
      params.addMessage("persist", "persistStoryList skip empty overwrite", {
        page,
        currentCount: current?.data?.length ?? 0,
      });
      return;
    }

    const incomingTimestamp = Math.max(
      ...storySummaries.map((item) => item.lastUpdated ?? 0),
      0
    );

    console.log("*** current", current);

    if (!current || incomingTimestamp > (current.serverUpdateTimestamp ?? 0)) {
      // save if none or if the incoming timestamp is newer
      params.addMessage("persist", "persistStoryList over store", {
        page,
        incomingTimestamp,
        currentTimestamp: current?.serverUpdateTimestamp,
      });
      setStoryListStore(page, {
        serverUpdateTimestamp: incomingTimestamp,
        page,
        data: storySummaries,
      });
      params.refreshStore.setRefreshTimestamp(page);
    }

    let skippedSaves = 0;

    // Persist raw items individually for detail pages
    for (const item of data) {
      const isValid = validateHnItemWithComments(item);
      if (!isValid.success) {
        console.error("invalid item", { error: isValid.error, item });
        continue;
      }

      const didSave = persistStoryToStorage(item.id, item);
      if (!didSave) {
        skippedSaves++;
      }
    }

    params.addMessage("persist", "persistStoryList done", {
      page,
      persisted: data.length,
      skippedSaves,
    });
  };

  // Remove stories that are not in current lists or recently read
  const purgeLocalForage = async () => {
    console.log("*** purging localforage");

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
      keys = await withLocalForageRetries(
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
      console.log("removing bad key", key);
      await safeRemoveItem(key);
    }

    // Optionally remove old list keys from previous versions
    const legacyListKeys = keys.filter((key) => key.startsWith("STORIES_"));
    for (const key of legacyListKeys) {
      await safeRemoveItem(key);
    }

    // Delete any raw_* entries that are not in idsToKeep
    const rawKeys = keys.filter((key) => key.startsWith("raw_"));
    console.log("raw keys:", rawKeys.length, "ids to keep:", idsToKeep.size);
    for (const key of rawKeys) {
      const id = Number(key.replace("raw_", ""));
      if (!idsToKeep.has(id)) {
        console.log("deleting", id);
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
    console.log("*** getContent", id, params.localForage());

    const item = await safeGetItem<HnItem>("raw_" + id);

    console.log("*** item", item);

    if (item) {
      params.addMessage("getContent", "found item in localforage", { id });
      console.log("found item in localforage", item);
      return item;
    }

    if (options?.allowNetwork === false) {
      return undefined;
    }

    return await fetchObjById(id, {
      addMessage: params.addMessage,
      persistStoryToStorage,
    });
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

    console.log("*** no list found, fetching from api", page);

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
    console.log("*** refreshActive", refreshType());
    params.addMessage("refreshActive", "refreshActive", {
      refreshType: refreshType(),
    });

    const type = refreshType();
    if (!type) {
      return;
    }

    // Ensure we scroll to the top when a refresh is initiated from any trigger
    try {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (_err) {
      // noop
    }

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

  return {
    storyListStore,
    isLoadingData,
    refreshType,
    setRefreshType,
    persistStoryList,
    persistStoryToStorage,
    purgeLocalForage,
    getContent,
    getContentForPage,
    refreshActive,
  };
}
