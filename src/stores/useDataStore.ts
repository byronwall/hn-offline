import { createEffect, createSignal } from "solid-js";

import { setActiveStoryList } from "~/features/storyList/HnStoryList";
import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { fetchObjById } from "~/lib/getContentViaFetch";
import {
  fetchAllStoryDataForPage,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { validateHnItemWithComments } from "~/lib/validation";
import { HnItem, HnStorySummary } from "~/models/interfaces";

import { setActiveStoryData } from "./activeStorySignal";
import { createPersistedStore } from "./createPersistedStore";
import { LOCAL_FORAGE_TO_USE } from "./localforage";
import { addMessage } from "./messages";
import { readItems } from "./useReadItemsStore";

export type StoryPage = "topstories" | "day" | "week";

export type StoryId = number;

type PersistedStoryList = {
  timestamp: number;
  page: StoryPage;
  data: HnStorySummary[];
};

type StoryListStore = Record<StoryPage, PersistedStoryList>;

export const [storyListStore, setStoryListStore, hasStoreLoaded] =
  createPersistedStore("STORY_LIST_STORE", {} as StoryListStore);

const waitingToLoad = new Promise<boolean>((resolve) => {
  createEffect(() => {
    if (hasStoreLoaded()) {
      resolve(true);
      addMessage("persist", "makePersisted done");
    }
  });
});

addMessage("persist", "past waitingToLoad");

export async function persistStoryList(page: StoryPage, data: HnItem[]) {
  // overall goals: update store -> saves list to local forage
  // then go through all items and save them to local forage
  addMessage("persist", "persistStoryList init", { page, count: data.length });

  // Do not persist if provided list is empty
  if (!data || data.length === 0) {
    addMessage("persist", "persistStoryList skip empty list", { page });
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

  // await waitingToLoad;

  const current = storyListStore[page];

  console.log("*** current", current);

  if (!current || incomingTimestamp > current.timestamp) {
    // save if none or if the incoming timestamp is newer
    addMessage("persist", "persistStoryList over store", {
      page,
      incomingTimestamp,
      currentTimestamp: current?.timestamp,
    });
    setStoryListStore(page, {
      timestamp: incomingTimestamp,
      page,
      data: storySummaries,
    });
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

  addMessage("persist", "persistStoryList done", {
    page,
    persisted: data.length,
    skippedSaves,
  });
}

// Remove stories that are not in current lists or recently read
export const purgeLocalForage = async () => {
  console.log("*** purging localforage");

  addMessage("purge", "purgeLocalForage init");

  const idsToKeep = new Set<number>();
  for (const page in storyListStore) {
    const persistedList = storyListStore[page as StoryPage];

    for (const item of persistedList.data) {
      idsToKeep.add(item.id);
    }
  }

  // Collect IDs from the READ_ITEMS store (recently read)
  for (const idStr of Object.keys(readItems)) {
    const id = Number(idStr);
    if (!Number.isNaN(id)) {
      idsToKeep.add(id);
    }
  }

  const keys = await LOCAL_FORAGE_TO_USE()?.keys();

  if (!keys) {
    return;
  }

  // Remove legacy/accidental keys that contain a slash
  const badKeys = keys.filter((key) => key.includes("/"));
  for (const key of badKeys) {
    console.log("removing bad key", key);
    await LOCAL_FORAGE_TO_USE()?.removeItem(key);
  }

  // Optionally remove old list keys from previous versions
  const legacyListKeys = keys.filter((key) => key.startsWith("STORIES_"));
  for (const key of legacyListKeys) {
    await LOCAL_FORAGE_TO_USE()?.removeItem(key);
  }

  // Delete any raw_* entries that are not in idsToKeep
  const rawKeys = keys.filter((key) => key.startsWith("raw_"));
  console.log("raw keys:", rawKeys.length, "ids to keep:", idsToKeep.size);
  for (const key of rawKeys) {
    const id = Number(key.replace("raw_", ""));
    if (!idsToKeep.has(id)) {
      console.log("deleting", id);
      await LOCAL_FORAGE_TO_USE()?.removeItem(key);
    }
  }

  addMessage("purge", "purgeLocalForage done");
};

export const persistStoryToStorage = async (id: StoryId, content: HnItem) => {
  // attempt to load item, only save if lastUpdated is newer
  const currentItem = await LOCAL_FORAGE_TO_USE()?.getItem<HnItem>("raw_" + id);

  if (currentItem && currentItem.lastUpdated >= content.lastUpdated) {
    return false;
  }

  await LOCAL_FORAGE_TO_USE()?.setItem("raw_" + id, content);
  return true;
};

export async function getContent(id: StoryId) {
  console.log("*** getContent", id);

  const item = await LOCAL_FORAGE_TO_USE()?.getItem<HnItem>("raw_" + id);

  if (item) {
    addMessage("getContent", "found item in localforage", { id });
    console.log("found item in localforage", item);
    return item;
  }

  return await fetchObjById(id);
}

export const [isLoadingData, setIsLoadingData] = createSignal(false);

export type ContentForPage =
  | {
      type: "summaryOnly";
      data: HnStorySummary[];
    }
  | {
      type: "fullData";
      data: HnItem[];
    };

export async function getContentForPage(
  rawPage: string
): Promise<ContentForPage> {
  addMessage("getContentForPage", "init", { rawPage });

  const page = convertPathToStoryPage(rawPage);

  await waitingToLoad;

  const list = storyListStore[page as StoryPage];

  if (list) {
    addMessage("getContentForPage", "found list in store", { page });
    return { type: "summaryOnly", data: list.data };
  }

  console.log("*** no list found, fetching from api", page);

  const data = await fetchAllStoryDataForPage(page);

  return { type: "fullData", data };
}

type RefreshType =
  | {
      type: "storyList";
      page: StoryPage;
    }
  | {
      type: "story";
      id: StoryId;
    };

export const [refreshType, setRefreshType] = createSignal<
  RefreshType | undefined
>(undefined);

export async function refreshActive() {
  console.log("*** refreshActive", refreshType());
  addMessage("refreshActive", "refreshActive", { refreshType: refreshType() });

  const type = refreshType();
  if (!type) {
    return;
  }

  setIsLoadingData(true);

  if (type.type === "storyList") {
    const pageData = await fetchAllStoryDataForPage(type.page);
    setActiveStoryList(pageData);
  } else if (type.type === "story") {
    const storyData = await fetchObjById(type.id);
    setActiveStoryData(storyData);
  }

  setIsLoadingData(false);
}
