import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";

import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { getContentViaFetch } from "~/lib/getContentViaFetch";
import {
  getSummaryViaFetch,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { validateHnItemWithComments } from "~/lib/validation";
import { HnItem, HnStorySummary } from "~/models/interfaces";

import { LOCAL_FORAGE_TO_USE } from "./localforage";

export type StoryPage = "front" | "day" | "week";

type StoryId = number;

type PersistedStoryList = {
  timestamp: number;
  page: StoryPage;
  data: HnStorySummary[];
};

type StoryListStore = Record<StoryPage, PersistedStoryList>;

export const [storyListStore, setStoryListStore] = makePersisted(
  createStore<StoryListStore>({} as StoryListStore),
  {
    name: "STORY_LIST_STORE",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as unknown as string,
    deserialize: (value) => value as unknown as StoryListStore,
  }
);

export async function saveStoryListViaReactive(
  page: StoryPage,
  data: HnItem[]
) {
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

// TODO: implement this again with new approach
const purgeLocalForage = async () => {
  // goal is to remove stories that are not current or recently read

  console.log("purging localforage");

  const idsToKeep = new Set<number>();

  // get the three main story lists - front, day, week
  // add those ids to the keep list

  const keys = await LOCAL_FORAGE_TO_USE.keys();

  // bad ones have a / in them - remove them
  const badStoryLists = keys.filter((key) => key.includes("/"));
  for (const key of badStoryLists) {
    console.log("removing bad key", key);
    await LOCAL_FORAGE_TO_USE.removeItem(key);
  }

  const storyIds = keys.filter((key) => key.startsWith("STORIES_"));

  for (const key of storyIds) {
    const list = await LOCAL_FORAGE_TO_USE.getItem<HnStorySummary[]>(key);

    if (list) {
      console.log("list to keep", list.length, key);
      for (const item of list) {
        idsToKeep.add(item.id);
      }
    }
  }

  // get all keys starting with RAW_
  const rawKeys = keys.filter((key) => key.startsWith("raw_"));

  console.log("all keys", rawKeys.length, idsToKeep.size);

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

export const refreshCurrent = async (url: string) => {
  // attempt to load from local info
  console.log("refreshing", url);

  // determine if page is a story or a list
  const isStory = url.startsWith("/story");

  if (isStory) {
    const apiUrl = "/api" + url;

    setIsLoadingData(true);
    const newContent = await getContentViaFetch(apiUrl);
    setIsLoadingData(false);

    if (newContent) {
      saveContent(newContent.id, newContent);
    }

    return newContent;
  }

  const isFrontPage = url === "/";

  if (isFrontPage) {
    url = "/topstories";
  }

  // need to hit topstories API
  const apiUrl = "/api/topstories" + url;
  setIsLoadingData(true);
  const { data, storySummaries } = await getSummaryViaFetch(apiUrl);

  console.log("storySummaries", storySummaries);

  setIsLoadingData(false);

  await saveStoryListViaReactive(url.replace("/", "") as StoryPage, data);

  return storySummaries;
};

export async function getContentForPage(rawPage: string) {
  console.log("*** getContentForPage", rawPage);
  // attempt to load from local info

  const page = convertPathToStoryPage(rawPage);

  // TODO: URL slug should move into the fetch call
  const urlSlug = "/api/topstories/" + page;

  if (urlSlug === undefined) {
    throw new Error("urlSlug is undefined");
  }

  // load the list from localforage
  const list = storyListStore[page as StoryPage];

  if (list) {
    console.log("*** loaded from localforage", unwrap(list), page);
    return list.data;
  }

  console.log("*** no list found, fetching from api", page);
  const { data, storySummaries } = await getSummaryViaFetch(urlSlug);

  if (!storySummaries) {
    throw new Error("storySummaries is undefined");
  }

  await saveStoryListViaReactive(page as StoryPage, data);

  return storySummaries;
}
