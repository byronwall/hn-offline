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

type StoryLists = Record<StoryPage, StoryId[]>;

type DataStore = {
  storyLists: StoryLists;
  rawData: Record<StoryId, HnItem>;

  isLocalForageInitialized: boolean;
};

type DataStoreActions = {
  getContent: (id: StoryId) => Promise<HnItem | undefined>;
  getContentForPage: (page: string) => Promise<HnStorySummary[] | undefined>;

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

      set({ isLocalForageInitialized: true });
    },

    async getContent(id: StoryId) {
      const url = "https://hn.byroni.us/api/story/" + id;

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

    async getContentForPage(page: string) {
      // attempt to load from local info
      const { storyLists, rawData, isLocalForageInitialized } = get();

      if (!isLocalForageInitialized) {
        console.error("localforage not initialized");
        return undefined;
      }

      // remove leading slash
      page = page.slice(1);

      const isIn = page in storyLists;

      if (!isIn) {
        console.error("error missing type");
        return undefined;
      }

      // load the list from localforage
      const list = await localforage.getItem<HnStorySummary[]>(
        "STORIES_" + page
      );

      if (list) {
        console.log("list", list);
        return list;
      }

      // no stored list, hit the API
      const urlMap = {
        front: "/topstories/topstories",
        day: "/topstories/day",
        week: "/topstories/week",
      };

      const urlSlug = urlMap[page as StoryPage];

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

      // replace the list with the new IDs
      const storySummaries = data.map<HnStorySummary>((c) => ({
        id: c.id,
        score: c.score,
        title: c.title,
        url: c.url,
        commentCount: c.descendants,
        time: c.time,
      }));

      // also save the new list to localforage
      localforage.setItem("STORIES_" + page, storySummaries);

      const newRawData: Record<StoryId, HnItem> = {};

      for (const item of data) {
        newRawData[item.id] = item;
        await localforage.setItem("raw_" + item.id, item);
      }

      set({ rawData: { ...rawData, ...newRawData } });

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
