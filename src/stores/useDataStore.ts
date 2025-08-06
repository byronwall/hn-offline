import localforage from "localforage";
import { createWithSignal } from "solid-zustand";

import { getCleanPathName } from "~/lib/getCleanPathName";
import { getContentViaFetch } from "~/lib/getContentViaFetch";
import {
  getSummaryViaFetch,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import { HasAuthorAndTime } from "~/models/interfaces";

import {
  initializeReadItemsFromLocalForage,
  purgeOldReadItems,
} from "./useReadItemsStore";

// TODO: these types are all a mess.  Use Pick and Omit and get it right later.

export interface HnItem extends HasAuthorAndTime {
  descendants?: number;
  id: number;
  score: number;
  title: string;
  type: string;
  url?: string; // optional for Ask HN and internal items
  kidsObj?: Array<KidsObj3 | null>;
  text?: string; // this is for Ask HN and others that are internal
  by: string; // override to make required
  time: number; // override to make required
}

export interface KidsObj3 {
  by?: string;
  id: number;
  parent: number;
  text?: string;
  time: number;
  type: string;
  kidsObj?: KidsObj3[];
  deleted?: boolean;
  dead?: boolean;
}

export interface HnStorySummary extends HasAuthorAndTime {
  title?: string;
  score?: number;
  id: number;
  url?: string;
  descendants?: number;
}

export type StoryPage = "front" | "day" | "week";

type StoryId = number;

type DataStore = {
  isLoadingData: boolean;
  storyListSaveCount: number;
};

type DataStoreActions = {
  getContent: (id: StoryId, fromLocalStorageOnly?: boolean) => Promise<HnItem>;

  getContentForPage: (
    page: string,
    fromLocalStorageOnly?: boolean
  ) => Promise<HnStorySummary[]>;

  initializeFromLocalForage: () => Promise<void>;

  saveStoryList: (
    page: StoryPage,
    data: HnItem[] | HnStorySummary[]
  ) => Promise<void>;
  saveContent: (id: StoryId, content: HnItem) => Promise<void>;

  refreshCurrent(url: string): Promise<HnItem | HnStorySummary[] | undefined>;

  purgeLocalForage: () => Promise<void>;
};

if (typeof window !== "undefined") {
  localforage.config({
    driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
    name: "hn_next",
    version: 1.0,
    size: 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
    description: "some description",
  });
}

export const useDataStore = createWithSignal<DataStore & DataStoreActions>(
  (set, get) => ({
    isLoadingData: false,
    storyListSaveCount: 0,

    purgeLocalForage: async () => {
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

      // get the recent read items to keep
      const readItemsToKeep = await purgeOldReadItems();
      for (const id of readItemsToKeep) {
        idsToKeep.add(id);
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
    },

    saveContent: async (id: StoryId, content: HnItem) => {
      // TODO: move this is out of the store
      await localforage.setItem("raw_" + id, content);

      console.log("saved to localforage", "raw_" + id, content);
    },

    saveStoryList: async (
      page: StoryPage,
      data: HnItem[] | HnStorySummary[]
    ) => {
      // TODO: move this is out of the store
      const storySummaries = mapStoriesToSummaries(data);

      // check if the timestamp is more recent than current
      // current saved at TIMESTAMP_{page}
      const currentTimestamp = await localforage.getItem<number>(
        "TIMESTAMP_" + page
      );

      // get max from data
      const dataTimestamp = Math.max(...data.map((item) => item.time ?? 0), 0);

      console.log("currentTimestamp", currentTimestamp, dataTimestamp);

      if (currentTimestamp && currentTimestamp >= dataTimestamp) {
        console.log("no need to save, current is newer or same");
        return;
      }

      // also save the new list to localforage
      console.log("saving to localforage", "STORIES_" + page, storySummaries);
      await localforage.setItem("STORIES_" + page, storySummaries);

      // save the timestamp
      await localforage.setItem("TIMESTAMP_" + page, dataTimestamp);

      for (const item of data) {
        await localforage.setItem("raw_" + item.id, item);
      }

      console.log("saved to localforage", "STORIES_" + page, storySummaries);

      set({
        storyListSaveCount: get().storyListSaveCount + 1,
      });
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

    initializeFromLocalForage: async () => {
      const { purgeLocalForage } = get();

      console.log("initializeFromLocalForage");

      // Initialize read items store
      await initializeReadItemsFromLocalForage();

      // do a purge in the future, 1 seconds
      setTimeout(purgeLocalForage, 1000);
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

    async getContentForPage(page: string, fromLocalStorageOnly = false) {
      // attempt to load from local info
      const { saveStoryList } = get();

      // remove leading slash
      page = getCleanPathName(page);

      if (page == "") {
        page = "topstories";
      }

      const urlSlug = "/api/topstories/" + page;

      if (urlSlug === undefined) {
        throw new Error("urlSlug is undefined");
      }

      const url = urlSlug;

      // load the list from localforage
      const list = await localforage.getItem<HnStorySummary[]>(
        "STORIES_" + page
      );

      if (list) {
        console.log("loaded from localforage", list, page);
        return list;
      }

      if (fromLocalStorageOnly) {
        console.log("fromLocalStorageOnly, and none found");
        throw new Error("fromLocalStorageOnly, and none found");
      }

      const { data, storySummaries } = await getSummaryViaFetch(url);

      if (!storySummaries) {
        throw new Error("storySummaries is undefined");
      }

      await saveStoryList(page as StoryPage, data);

      return storySummaries;
    },
  })
);
