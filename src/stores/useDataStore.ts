import { makePersisted } from "@solid-primitives/storage";
import localforage from "localforage";
import { createStore, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";
import { createWithSignal } from "solid-zustand";

import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { getContentViaFetch } from "~/lib/getContentViaFetch";
import {
  getSummaryViaFetch,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { validateHnItemWithComments } from "~/lib/validation";
import { HnItem, HnStorySummary } from "~/models/interfaces";

export type StoryPage = "front" | "day" | "week";

type StoryId = number;

type DataStore = {
  isLoadingData: boolean;
};

type DataStoreActions = {
  getContent: (id: StoryId, fromLocalStorageOnly?: boolean) => Promise<HnItem>;

  getContentForPage: (page: string) => Promise<HnStorySummary[]>;

  saveStoryList: (page: StoryPage, data: HnItem[]) => Promise<void>;
  saveContent: (id: StoryId, content: HnItem) => Promise<void>;

  refreshCurrent(url: string): Promise<HnItem | HnStorySummary[] | undefined>;
};

if (!isServer) {
  localforage.config({
    driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
    name: "hn_next",
    version: 1.0,
    size: 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
    description: "some description",
  });
}

// this is meant to be the primary reference to localforage
// goal is to ensure it's only configured in 1 file
export const LOCAL_FORAGE_TO_USE = localforage;

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

function saveStoryListViaReactive(page: StoryPage, data: HnStorySummary[]) {
  const current = storyListStore[page];

  if (current) {
    const maxTimestampOfData = Math.max(
      ...data.map((item) => item.time ?? 0),
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
    data,
  });

  console.log("*** saved to localforage via new store", page, data);
}

// TODO: implement this again with new approach
const purgeLocalForage = async () => {
  // goal is to remove stories that are not current or recently read

  console.log("purging localforage");

  const idsToKeep = new Set<number>();

  // get the three main story lists - front, day, week
  // add those ids to the keep list

  const keys = await localforage.keys();

  // bad ones have a / in them - remove them
  const badStoryLists = keys.filter((key) => key.includes("/"));
  for (const key of badStoryLists) {
    console.log("removing bad key", key);
    await localforage.removeItem(key);
  }

  const storyIds = keys.filter((key) => key.startsWith("STORIES_"));

  for (const key of storyIds) {
    const list = await localforage.getItem<HnStorySummary[]>(key);

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
      await localforage.removeItem(key);
    }
  }
};

export const useDataStore = createWithSignal<DataStore & DataStoreActions>(
  (set, get) => ({
    isLoadingData: false,

    saveContent: async (id: StoryId, content: HnItem) => {
      // TODO: move this is out of the store
      await localforage.setItem("raw_" + id, content);

      console.log("saved to localforage", "raw_" + id, content);
    },

    saveStoryList: async (page: StoryPage, data: HnItem[]) => {
      // TODO: move this is out of the store
      const storySummaries = mapStoriesToSummaries(data);

      if (!storySummaries) {
        // this really shouldn't happen -- figure out source
        throw new Error("storySummaries is undefined");
      }

      saveStoryListViaReactive(page, storySummaries);

      // TODO: this needs to convert to reactive store next

      console.log("*** saving single stories now", page, data);

      for (const item of data) {
        // console.log("*** saving single story now", item);
        // tracking down when bad items are saved
        // this guards against a summary being stored as the raw item
        // TODO: figure out that code path - no good - saving client data - should be OK now
        const isValid = validateHnItemWithComments(item);
        if (!isValid.success) {
          console.error("invalid item", isValid.error, item);
          continue;
        }
        await localforage.setItem("raw_" + item.id, item);
      }
    },

    refreshCurrent: async (url: string) => {
      // attempt to load from local info
      const { saveContent, saveStoryList } = get();

      console.log("refreshing", url);

      // determine if page is a story or a list
      const isStory = url.startsWith("/story");

      if (isStory) {
        const apiUrl = "/api" + url;

        set({ isLoadingData: true });
        const newContent = await getContentViaFetch(apiUrl);
        set({ isLoadingData: false });

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
      set({ isLoadingData: true });
      const { data, storySummaries } = await getSummaryViaFetch(apiUrl);

      console.log("storySummaries", storySummaries);

      set({ isLoadingData: false });

      await saveStoryList(url.replace("/", "") as StoryPage, data);

      return storySummaries;
    },

    async getContent(id: StoryId, fromLocalStorageOnly = false) {
      // attempt to load from local info
      const { saveContent } = get();
      console.log("getContent", id);

      const url = "/api/story/" + id;

      // load the item from localforage
      const item = await localforage.getItem<HnItem>("raw_" + id);

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
    },

    async getContentForPage(rawPage: string) {
      console.log("*** getContentForPage", rawPage);
      // attempt to load from local info
      const { saveStoryList } = get();

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

      await saveStoryList(page as StoryPage, data);

      return storySummaries;
    },
  })
);
