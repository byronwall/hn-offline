"use client";

import localforage from "localforage";
import { create } from "zustand";

export interface HnItem {
  by: string;
  descendants?: number;
  id: number;
  score: number;
  time: number;
  title: string;
  type: string;
  url?: string; // optional for Ask HN and internal items
  kidsObj?: Array<KidsObj3 | null>;
  lastUpdated: number;
  text?: string; // this is for Ask HN and others that are internal
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

type StoryPage = "front" | "day" | "week";

type StoryId = number;

type DataStore = {
  rawData: Record<StoryId, HnItem>;

  isLocalForageInitialized: boolean;

  dataNonce: number;
  isLoadingData: boolean;
};

type DataStoreActions = {
  getContent: (id: StoryId) => Promise<HnItem | undefined>;
  getContentForPage: (page: string) => Promise<HnStorySummary[] | undefined>;

  initializeFromLocalForage: () => void;

  saveStoryList: (
    page: StoryPage,
    list: HnStorySummary[],
    data: HnItem[]
  ) => void;
  saveContent: (id: StoryId, content: HnItem) => void;

  refreshCurrent(url: string): Promise<HnItem | HnStorySummary[] | undefined>;
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

export const useDataStore = create<DataStore & DataStoreActions>(
  (set, get) => ({
    dataNonce: 0,
    isLoadingData: false,
    isLocalForageInitialized: false,
    storyLists: {
      front: [],
      day: [],
      week: [],
    },
    rawData: {},

    saveContent: (id: StoryId, content: HnItem) => {
      const { rawData, dataNonce } = get();

      set({
        rawData: { ...rawData, [id]: content },
        dataNonce: dataNonce + 1,
      });

      localforage.setItem("raw_" + id, content);
    },

    saveStoryList: async (
      page: StoryPage,
      storySummaries: HnStorySummary[],
      data: HnItem[]
    ) => {
      const { rawData, dataNonce } = get();

      // also save the new list to localforage
      console.log("saving to localforage", "STORIES_" + page, storySummaries);
      await localforage.setItem("STORIES_" + page, storySummaries);

      const newRawData: Record<StoryId, HnItem> = {};

      for (const item of data) {
        newRawData[item.id] = item;
        await localforage.setItem("raw_" + item.id, item);
      }

      set({
        rawData: { ...rawData, ...newRawData },
        dataNonce: dataNonce + 1,
      });
    },

    refreshCurrent: async (url: string) => {
      // attempt to load from local info
      const { isLocalForageInitialized, saveContent, saveStoryList } = get();

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

      // need to hit topsotries API
      const apiUrl = "/api/topstories" + url;
      set({ isLoadingData: true });
      const { data, storySummaries } = await getSummaryViaFetch(apiUrl);

      console.log("storySummaries", storySummaries);

      set({ isLoadingData: false });

      saveStoryList(url.replace("/", "") as StoryPage, storySummaries, data);

      return storySummaries;
    },

    initializeFromLocalForage: async () => {
      // attempt to load from localforage

      set({ isLocalForageInitialized: true });
    },

    async getContent(id: StoryId) {
      // attempt to load from local info
      const { rawData, isLocalForageInitialized, saveContent } = get();

      const url = "/api/story/" + id;

      if (!isLocalForageInitialized) {
        // kick out for SSR
        console.error("localforage not initialized");
        const data = await getContentViaFetch(url);

        if (data) saveContent(id, data);

        return data;
      }

      // check if we have the item in the cache
      if (id in rawData) {
        return rawData[id];
      }

      // load the item from localforage
      const item = await localforage.getItem<HnItem>("raw_" + id);

      if (item) {
        return item;
      }

      const data = await getContentViaFetch(url);
      if (data) saveContent(id, data);

      return data;
    },

    async getContentForPage(page: string) {
      // attempt to load from local info
      const { isLocalForageInitialized, saveStoryList } = get();

      // remove leading slash
      page = page.slice(1);

      if (page == "") {
        page = "topstories";
      }

      const urlSlug = "/api/topstories/" + page;

      if (urlSlug === undefined) {
        console.error("error missing type");
        return undefined;
      }

      const url = urlSlug;

      if (!isLocalForageInitialized) {
        console.log("localforage not initialized");
        const { storySummaries } = await getSummaryViaFetch(url);

        return storySummaries;
      }

      // load the list from localforage
      const list = await localforage.getItem<HnStorySummary[]>(
        "STORIES_" + page
      );

      if (list) {
        console.log("loaded from localforage", list, page);
        return list;
      }

      const { data, storySummaries } = await getSummaryViaFetch(url);

      saveStoryList(page as StoryPage, storySummaries, data);

      return storySummaries;
    },
  })
);
export interface HnStorySummary {
  title: string;
  score: number;
  id: number;
  url: string | undefined;
  commentCount: number | undefined;
  time: number;
}
export type TrueHash = {
  [key: number]: true;
};

async function getContentViaFetch(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(response);
    return undefined;
  }
  const data: HnItem | { error: string } = await response.json();

  if ("error" in data) {
    console.error(data);

    return undefined;
  }

  return data;
}

async function getSummaryViaFetch(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    console.error(response);
    return { data: [], storySummaries: [] as HnStorySummary[] };
  }

  const data = (await response.json()) as HnItem[];

  // replace the list with the new IDs
  const storySummaries = data.map<HnStorySummary>((c) => ({
    id: c.id,
    score: c.score,
    title: c.title,
    url: c.url,
    commentCount: c.descendants,
    time: c.time,
  }));

  return { data, storySummaries };
}
