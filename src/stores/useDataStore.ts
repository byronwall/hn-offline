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

    const incomingTimestamp = Math.max(
      ...storySummaries.map((item) => item.lastUpdated ?? 0),
      0
    );

    const current = storyListStore[page];

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

    const keys = await params.localForage()?.keys();

    if (!keys) {
      return;
    }

    // Remove legacy/accidental keys that contain a slash
    const badKeys = keys.filter((key) => key.includes("/"));
    for (const key of badKeys) {
      console.log("removing bad key", key);
      await params.localForage()?.removeItem(key);
    }

    // Optionally remove old list keys from previous versions
    const legacyListKeys = keys.filter((key) => key.startsWith("STORIES_"));
    for (const key of legacyListKeys) {
      await params.localForage()?.removeItem(key);
    }

    // Delete any raw_* entries that are not in idsToKeep
    const rawKeys = keys.filter((key) => key.startsWith("raw_"));
    console.log("raw keys:", rawKeys.length, "ids to keep:", idsToKeep.size);
    for (const key of rawKeys) {
      const id = Number(key.replace("raw_", ""));
      if (!idsToKeep.has(id)) {
        console.log("deleting", id);
        await params.localForage()?.removeItem(key);
      }
    }

    params.addMessage("purge", "purgeLocalForage done");
  };

  const persistStoryToStorage = async (id: StoryId, content: HnItem) => {
    // attempt to load item, only save if lastUpdated is newer
    const currentItem = await params
      .localForage()
      ?.getItem<HnItem>("raw_" + id);

    if (currentItem && currentItem.lastUpdated >= content.lastUpdated) {
      return false;
    }

    await params.localForage()?.setItem("raw_" + id, content);
    return true;
  };

  const getContent = async (
    id: StoryId,
    options?: { allowNetwork?: boolean }
  ) => {
    console.log("*** getContent", id, params.localForage());

    const item = await params.localForage()?.getItem<HnItem>("raw_" + id);

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
