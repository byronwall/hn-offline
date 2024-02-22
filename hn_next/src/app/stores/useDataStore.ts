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

interface KidsObj3 {
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

type StoryLists = Record<StoryPage, StoryId[]>;

type DataStore = {
  storyLists: StoryLists;
  rawData: Record<StoryId, HnItem>;

  isLocalForageInitialized: boolean;
};

type DataStoreActions = {
  getContent: (id: StoryId) => Promise<HnItem | undefined>;
  getContentForPage: (page: StoryPage) => Promise<HnItem[] | undefined>;

  initializeFromLocalForage: () => void;
};

localforage.config({
  driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
  name: "hn_next",
  version: 1.0,
  size: 4980736, // Size of database, in bytes. WebSQL-only for now.
  storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
  description: "some description",
});

export const useDataStore = create<DataStore & DataStoreActions>(
  (set, get) => ({
    isLocalForageInitialized: false,
    storyLists: {
      front: [],
      day: [],
      week: [],
    },
    rawData: {},

    initializeFromLocalForage: async () => {
      // attempt to load from localforage
      const storyLists = await localforage.getItem<StoryLists>("storyLists");

      console.log("storyLists", storyLists);

      if (storyLists) {
        set({ storyLists });
      }

      // get list of all localforage keys
      const keys = await localforage.keys();

      const newRawData: Record<StoryId, HnItem> = {};

      for (const key of keys) {
        if (!key.startsWith("raw_")) continue;

        const value = await localforage.getItem<HnItem>(key);

        const id = parseInt(key.split("_")[1]);

        if (value) {
          newRawData[id] = value;
        }
      }

      if (Object.keys(newRawData).length > 0) {
        set({ rawData: newRawData });
      }

      set({ isLocalForageInitialized: true });
    },

    async getContent(id: StoryId) {
      const url = "/api/story/" + id;

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

      console.log("hn item from server", data);

      return data;
    },

    async getContentForPage(page: StoryPage) {
      // attempt to load from local info
      const { storyLists, rawData, isLocalForageInitialized } = get();

      if (!isLocalForageInitialized) {
        console.error("localforage not initialized");
        return undefined;
      }

      const list = storyLists[page];
      console.log("list", { list, storyLists, rawData });
      if (list.length > 0) {
        // check they all have data
        const isGood = list.every((id) => rawData[id] !== undefined);
        if (isGood) {
          const items = list.map((id) => rawData[id]);
          console.log("items via cache", items);
          return items;
        }
      }

      const urlMap = {
        front: "/topstories/topstories",
        day: "/topstories/day",
        week: "/topstories/week",
      };

      const urlSlug = urlMap[page];

      console.log("urlSlug", urlSlug);

      if (urlSlug === undefined) {
        console.error("error missing type");
        return undefined;
      }

      const url = "https://hn.byroni.us" + urlSlug;

      const response = await fetch(url);
      const data = (await response.json()) as HnItem[];

      const newStoryList = {
        ...storyLists,
        [page]: data.map((item) => item.id),
      };

      // update the cache and localforage
      set({
        storyLists: newStoryList,
      });

      // update localforage
      await localforage.setItem("storyLists", newStoryList);

      const newRawData: Record<StoryId, HnItem> = {};

      for (const item of data) {
        newRawData[item.id] = item;
        await localforage.setItem("raw_" + item.id, item);
      }

      set({ rawData: { ...rawData, ...newRawData } });

      return data;
    },
  })
);
