import { type Accessor, createEffect, createSignal } from "solid-js";

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
import { dropConnection } from "./localforage";
import { withRetries } from "./withRetries";

import type { AddMessage } from "./messages";
import type { createStoryUiStore } from "./storyUiStore";
import type { ReadItemsStore } from "./useReadItemsStore";
import type { createRefreshStore } from "./useRefreshStore";
import type { StoryPage } from "~/models/interfaces";
import type { WithServerInfo } from "~/server/queries";

export type StoryId = number;

// A list page is only an ordered list of ids. The story data itself lives
// once, in STORY_SUMMARIES, so Top/Day/Week always show the same numbers.
type PersistedStoryList = {
  serverUpdateTimestamp: number;
  page: StoryPage;
  ids: number[];
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
  whenReady: () => Promise<LocalForage | undefined>;
  readItemsStore: ReadItemsStore;
  refreshStore: ReturnType<typeof createRefreshStore>;
  storyUi: ReturnType<typeof createStoryUiStore>;
}) {
  // Wait for storage to open, then run with retries.
  const retry = async <T>(
    operationName: string,
    operation: (lf: LocalForage) => Promise<T>
  ) => {
    const lf = await params.whenReady();
    if (!lf) {
      throw new Error("IndexedDB did not open");
    }
    return withRetries(
      () => operation(lf),
      (attempt, delayMs, error) => {
        dropConnection(lf, error);
        params.addMessage("localforage", `${operationName} retry`, {
          attempt,
          delayMs,
        });
      }
    );
  };

  const safeGetItem = async <T>(key: string): Promise<T | undefined> => {
    try {
      const value = await retry("getItem", (lf) => lf.getItem<T>(key));
      return value ?? undefined;
    } catch (error) {
      console.error("*** localForage getItem failed", { key, error });
      params.addMessage("localforage", "getItem failed", { key });
      return undefined;
    }
  };

  const safeSetItem = async <T>(key: string, value: T): Promise<boolean> => {
    try {
      await retry("setItem", (lf) => lf.setItem(key, value));
      return true;
    } catch (error) {
      console.error("*** localForage setItem failed", { key, error });
      params.addMessage("localforage", "setItem failed", { key });
      return false;
    }
  };

  const safeRemoveItem = async (key: string): Promise<void> => {
    try {
      await retry("removeItem", (lf) => lf.removeItem(key));
    } catch (error) {
      console.error("*** localForage removeItem failed", { key, error });
      params.addMessage("localforage", "removeItem failed", { key });
    }
  };

  const [storyListStore, setStoryListStore, listsHydrated] =
    createPersistedStore(
      "STORY_LIST_STORE",
      {} as StoryListStore,
      params.localForage
    );

  // One record per story, shared by every list and the story page.
  const [storySummaries, setStorySummaries, summariesHydrated] =
    createPersistedStore(
      "STORY_SUMMARIES",
      {} as Record<number, HnStorySummary>,
      params.localForage
    );

  // Merge fresh story data into the shared records; newest lastUpdated wins.
  const upsertSummaries = (stories: (HnItem | HnStorySummary)[]) => {
    const changed: Record<number, HnStorySummary> = {};
    for (const story of mapStoriesToSummaries(stories) ?? []) {
      const current = storySummaries[story.id];
      if (!current || (story.lastUpdated ?? 0) >= (current.lastUpdated ?? 0)) {
        changed[story.id] = story;
      }
    }
    if (Object.keys(changed).length > 0) {
      void setStorySummaries((current) => ({ ...current, ...changed }));
    }
  };

  // The stories on a list page, in list order, from the shared records.
  const listStories = (page: StoryPage) =>
    (storyListStore[page]?.ids ?? [])
      .map((id) => storySummaries[id])
      .filter((story): story is HnStorySummary => story !== undefined);

  // Save a list page: its stories into the shared records, its order here.
  const saveListSummaries = async (
    page: StoryPage,
    stories: (HnItem | HnStorySummary)[]
  ) => {
    if (stories.length === 0) {
      return;
    }
    upsertSummaries(stories);

    const ids = stories.map((story) => story.id);
    const incomingTimestamp = Math.max(
      ...stories.map((story) => story.lastUpdated ?? 0),
      0
    );
    const current = storyListStore[page];
    const changed =
      !current?.ids ||
      incomingTimestamp > current.serverUpdateTimestamp ||
      ids.join() !== current.ids.join();
    if (!changed) {
      return;
    }

    await setStoryListStore(page, {
      serverUpdateTimestamp: incomingTimestamp,
      page,
      ids,
    });
    params.refreshStore.setRefreshTimestamp(page);
  };

  // Save a list page and every full story on it for offline reading.
  const persistStoryList = async (page: StoryPage, data: HnItem[]) => {
    params.addMessage("persist", "persistStoryList init", {
      page,
      count: data.length,
    });

    await saveListSummaries(page, data);

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
    for (const list of Object.values(storyListStore)) {
      for (const id of list?.ids ?? []) {
        idsToKeep.add(id);
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
      keys = await retry("keys", (lf) => lf.keys());
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

    // Shared story records follow the same rule.
    void setStorySummaries((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => idsToKeep.has(Number(id)))
      )
    );

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
      const story = await fetchObjById(id, {
        addMessage: params.addMessage,
        persistStoryToStorage,
      });
      upsertSummaries([story]);
      return story;
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

    if (list?.ids) {
      params.addMessage("getContentForPage", "found list in store", { page });
      return { type: "summaryOnly", data: listStories(page) };
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
        upsertSummaries([storyData]);
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
    void saveListSummaries(page, latest.result.data);
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
    upsertSummaries([story]);
    params.storyUi.setActiveStoryData(story);
    setRefreshType({ type: "story", id });
  };

  // Drop cached stories that left every list and were not read recently,
  // once per session after the stored lists load.
  let purgeScheduled = false;
  createEffect(() => {
    if (
      purgeScheduled ||
      !listsHydrated() ||
      !summariesHydrated() ||
      !params.readItemsStore.readItemsHydrated()
    ) {
      return;
    }
    purgeScheduled = true;
    setTimeout(() => void purgeLocalForage(), 10_000);
  });

  return {
    storyListStore,
    storySummaries,
    listStories,
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
