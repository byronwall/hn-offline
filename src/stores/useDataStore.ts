import { makePersisted } from "@solid-primitives/storage";
import { createMemo, createReaction, createSignal } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";

import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { getContentViaFetch } from "~/lib/getContentViaFetch";
import {
  getAllStoryDataForPage,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { validateHnItemWithComments } from "~/lib/validation";
import { HnItem, HnStorySummary } from "~/models/interfaces";

import { LOCAL_FORAGE_TO_USE } from "./localforage";
import { readItems } from "./useReadItemsStore";

export type StoryPage = "front" | "day" | "week";

type StoryId = number;

type PersistedStoryList = {
  timestamp: number;
  page: StoryPage;
  data: HnStorySummary[];
};

type StoryListStore = Record<StoryPage, PersistedStoryList>;

export const [storyListStore, setStoryListStore] = makePersisted(
  // eslint-disable-next-line solid/reactivity
  createStore<StoryListStore>({} as StoryListStore),
  {
    name: "STORY_LIST_STORE",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as unknown as string,
    deserialize: (value) => value as unknown as StoryListStore,
  }
);

// After initial hydration/change of the story lists, schedule a purge of old raw_* entries
const hasStoreLoaded = createMemo(() => Object.keys(storyListStore).length > 0);
const schedulePurge = createReaction(() => setTimeout(purgeLocalForage, 1000));
schedulePurge(hasStoreLoaded);

export async function saveStoryListViaReactive(
  page: StoryPage,
  data: HnItem[]
) {
  console.log("*** saveStoryListViaReactive", page, data);

  // Map raw items to summaries for list storage
  const storySummaries = mapStoriesToSummaries(data);

  if (!storySummaries) {
    throw new Error("storySummaries is undefined");
  }

  const current = storyListStore[page];

  if (current) {
    const maxTimestampOfData = Math.max(
      ...storySummaries.map((item) => item.time ?? 0),
      0
    );
    const isSavedNewerOrSame = current.timestamp >= maxTimestampOfData;

    if (isSavedNewerOrSame) {
      console.log("*** no need to save, current is newer or same");
      return;
    }
  }

  setStoryListStore(page, {
    timestamp: Date.now(),
    page,
    data: storySummaries,
  });

  console.log("*** saved to localforage via new store", page, storySummaries);

  // Persist raw items individually for detail pages
  console.log("*** saving single stories now", page, data);
  for (const item of data) {
    const isValid = validateHnItemWithComments(item);
    if (!isValid.success) {
      console.error("invalid item", isValid.error, item);
      continue;
    }
    await LOCAL_FORAGE_TO_USE.setItem("raw_" + item.id, item);
  }
}

// Remove stories that are not in current lists or recently read
export const purgeLocalForage = async () => {
  console.log("*** purging localforage");

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

  const keys = await LOCAL_FORAGE_TO_USE.keys();

  // Remove legacy/accidental keys that contain a slash
  const badKeys = keys.filter((key) => key.includes("/"));
  for (const key of badKeys) {
    console.log("removing bad key", key);
    await LOCAL_FORAGE_TO_USE.removeItem(key);
  }

  // Optionally remove old list keys from previous versions
  const legacyListKeys = keys.filter((key) => key.startsWith("STORIES_"));
  for (const key of legacyListKeys) {
    await LOCAL_FORAGE_TO_USE.removeItem(key);
  }

  // Delete any raw_* entries that are not in idsToKeep
  const rawKeys = keys.filter((key) => key.startsWith("raw_"));
  console.log("raw keys:", rawKeys.length, "ids to keep:", idsToKeep.size);
  for (const key of rawKeys) {
    const id = Number(key.replace("raw_", ""));
    if (!idsToKeep.has(id)) {
      console.log("deleting", id);
      await LOCAL_FORAGE_TO_USE.removeItem(key);
    }
  }
};

const saveContent = async (id: StoryId, content: HnItem) => {
  await LOCAL_FORAGE_TO_USE.setItem("raw_" + id, content);

  console.log("saved to localforage", "raw_" + id, content);
};

export async function getContent(id: StoryId, fromLocalStorageOnly = false) {
  // attempt to load from local info
  console.log("getContent", id);

  const url = "/api/story/" + id;

  // load the item from localforage
  const item = await LOCAL_FORAGE_TO_USE.getItem<HnItem>("raw_" + id);

  if (item) {
    console.log("found item in localforage", item);
    return item;
  }

  if (fromLocalStorageOnly) {
    console.log("fromLocalStorageOnly");
    throw new Error("fromLocalStorageOnly");
  }

  const data = await getContentViaFetch(url);
  if (data) {
    await saveContent(id, data);
  }

  if (!data) {
    throw new Error("data is undefined");
  }

  return data;
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
  console.log("*** getContentForPage", rawPage);

  const page = convertPathToStoryPage(rawPage);

  const list = storyListStore[page as StoryPage];

  if (list) {
    return { type: "summaryOnly", data: list.data };
  }

  console.log("*** no list found, fetching from api", page);

  const data = await getAllStoryDataForPage(page);

  return { type: "fullData", data };
}
