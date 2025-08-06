import localforage from "localforage";
import { createWithSignal } from "solid-zustand";

import { getCleanPathName } from "~/lib/getCleanPathName";
import { getContentViaFetch } from "~/lib/getContentViaFetch";
import {
  getSummaryViaFetch,
  mapStoriesToSummaries,
} from "~/lib/getSummaryViaFetch";
import {
  getInitialCollapsedState,
  openCommentsDatabase,
} from "~/lib/indexedDb";
import { HasAuthorAndTime } from "~/models/interfaces";

import { activeStoryData } from "./activeStorySignal";
import { findNextSibling } from "./findNextSibling";

let db: IDBDatabase | null = null;

export interface Comment {
  id: number;
  collapsed: boolean;
  timestamp: number;
}

interface CommentStore {
  collapsedIds: Record<number, true>;
  fetchInitialCollapsedState: () => void;
  updateCollapsedState: (
    commentId: number | undefined,
    collapsed: boolean
  ) => void;
  cleanUpOldEntries: () => void;
}

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

export type TimestampHash = Record<number, number>;

export type StoryPage = "front" | "day" | "week";

type StoryId = number;

type DataStore = {
  readItems: TimestampHash;
  pendingReadItems: number[];

  isLocalForageInitialized: boolean;

  isLoadingData: boolean;

  shouldHideReadItems: boolean;

  storyListSaveCount: number;

  scrollToId: number | undefined;
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

  saveIdToReadList: (id: number) => Promise<void>;

  purgeLocalForage: () => Promise<void>;

  setShouldHideReadItems: (shouldHide: boolean) => Promise<void>;

  // TODO: should not be in here - not related to local storage
  clearScrollToId: () => void;
  setScrollToId: (id: number) => void;

  handleCollapseEvent: (id: number, newOpen: boolean) => void;
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

const LOCAL_READ_ITEMS = "STORAGE_READ_ITEMS";
const SHOULD_HIDE_READ_ITEMS = "SHOULD_HIDE_READ_ITEMS";

export const useDataStore = createWithSignal<
  DataStore & DataStoreActions & CommentStore
>((set, get) => ({
  isLoadingData: false,
  isLocalForageInitialized: false,

  storyListSaveCount: 0,

  shouldHideReadItems: false,

  scrollToId: undefined,
  setScrollToId: (id) => {
    set({ scrollToId: id });
  },
  clearScrollToId: () => {
    set({ scrollToId: undefined });
  },

  setShouldHideReadItems: async (shouldHide = false) => {
    console.log("setShouldHideReadItems", shouldHide);
    set({ shouldHideReadItems: shouldHide });

    // save via localforage
    await localforage.setItem(SHOULD_HIDE_READ_ITEMS, shouldHide);
  },

  readItems: {},
  pendingReadItems: [],

  purgeLocalForage: async () => {
    // goal is to remove stories that are not current or recently read

    console.log("purging localforage");

    const { readItems } = get();

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

    // get the 50 most recent read items
    const readItemsArray = Object.entries(readItems).sort(
      (a, b) => b[1] - a[1]
    );

    console.log("readItemsArray", readItemsArray);

    const maxToKeep = Math.min(50, readItemsArray.length);

    for (let i = 0; i < maxToKeep; i++) {
      idsToKeep.add(Number(readItemsArray[i][0]));
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

  saveIdToReadList: async (id: number) => {
    const { readItems, isLocalForageInitialized, pendingReadItems } = get();

    if (!isLocalForageInitialized) {
      // don't save data before list is loaded --- will clear it
      console.log("localforage not initialized for saveIdToReadList");
      set({ pendingReadItems: [...pendingReadItems, id] });
      return;
    }

    console.log("new read list", readItems);

    // skip out if already there
    if (readItems[id]) {
      return;
    }

    const newReadList = { ...readItems };
    newReadList[id] = Date.now();

    await localforage.setItem(LOCAL_READ_ITEMS, newReadList);

    set({ readItems: newReadList });
  },

  saveContent: async (id: StoryId, content: HnItem) => {
    // TODO: move this is out of the store
    await localforage.setItem("raw_" + id, content);

    console.log("saved to localforage", "raw_" + id, content);
  },

  saveStoryList: async (page: StoryPage, data: HnItem[] | HnStorySummary[]) => {
    // TODO: move this is out of the store
    const storySummaries = mapStoriesToSummaries(data);

    // check if the timestamp is more recent than current
    // current saved at TIMESTAMP_{page}
    const currentTimestamp = await localforage.getItem<number>(
      "TIMESTAMP_" + page
    );

    // get max from data
    const dataTimestamp = data.reduce((acc, item) => {
      return Math.max(acc, item.time ?? 0);
    }, 0);

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
    // load the read items
    const {
      purgeLocalForage,
      isLocalForageInitialized,
      fetchInitialCollapsedState,
    } = get();

    if (isLocalForageInitialized) {
      console.log("already initialized");
      return;
    }

    console.log("initializeFromLocalForage");

    const readItems =
      (await localforage.getItem<TimestampHash>(LOCAL_READ_ITEMS)) ?? {};

    const { pendingReadItems } = get();

    // add any pending items
    for (const id of pendingReadItems) {
      readItems[id] = Date.now();
    }

    // get the shouldHideReadItems
    const shouldHideReadItems =
      (await localforage.getItem<boolean>(SHOULD_HIDE_READ_ITEMS)) || false;

    console.log("**** initializeFromLocalForage done", {
      readItems,
      shouldHideReadItems,
    });

    set({
      isLocalForageInitialized: true,
      readItems,
      pendingReadItems: [],
      shouldHideReadItems,
    });

    fetchInitialCollapsedState();

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
    const list = await localforage.getItem<HnStorySummary[]>("STORIES_" + page);

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

  // ***** related to comments *****

  collapsedIds: {},

  fetchInitialCollapsedState: async () => {
    console.log("*** fetchInitialCollapsedState");
    try {
      // Open the indexedDB database if it hasn't been opened yet
      if (!db) {
        db = await openCommentsDatabase();
      }

      const collapsedIdsArr = await getInitialCollapsedState(db);
      const collapsedIds: Record<number, true> = {};

      collapsedIdsArr.forEach((id) => {
        collapsedIds[id] = true;
      });

      console.log("Initial collapsed state fetched: ", collapsedIds);
      set({ collapsedIds });

      // Clean up old entries in 1 second
      setTimeout(() => {
        set((state) => {
          state.cleanUpOldEntries();
          return state;
        });
      }, 1000);
    } catch (error) {
      console.error("Error fetching initial collapsed states: ", error);
    }
  },

  updateCollapsedState: async (commentId, collapsed) => {
    if (!commentId) {
      return;
    }

    if (!db) {
      db = await openCommentsDatabase();
    }

    const transaction = db.transaction(["comments"], "readwrite");
    const store = transaction.objectStore("comments");

    if (collapsed) {
      const request = store.put({
        id: commentId,
        collapsed,
        timestamp: Date.now(),
      } as Comment);

      request.onsuccess = function () {
        console.log("Collapse state updated.");
        set((state) => ({
          collapsedIds: { ...state.collapsedIds, [commentId]: true },
        }));
      };

      request.onerror = function () {
        console.error("Error updating collapse state: ", request.error);
      };
    } else {
      const request = store.delete(commentId);

      request.onsuccess = function () {
        console.log("Collapse state removed.");
        set((state) => {
          const newCollapsedIds = { ...state.collapsedIds };
          delete newCollapsedIds[commentId];

          return {
            collapsedIds: newCollapsedIds,
          };
        });
      };

      request.onerror = function () {
        console.error("Error removing collapse state: ", request.error);
      };
    }
  },

  cleanUpOldEntries: async () => {
    if (!db) {
      db = await openCommentsDatabase();
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const transaction = db.transaction(["comments"], "readwrite");
    const store = transaction.objectStore("comments");
    const index = store.index("timestamp");

    const request = index.openCursor(IDBKeyRange.upperBound(oneWeekAgo));

    request.onsuccess = function (event: Event) {
      const cursor = (event.target as IDBRequest).result;

      // log how items are being deleted
      if (cursor) {
        console.log("Cleaning up old entry: ", cursor.value);
      }

      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    request.onerror = function () {
      console.error("Error cleaning up old entries: ", request.error);
    };
  },

  handleCollapseEvent(id: number, newOpen: boolean) {
    const { updateCollapsedState, setScrollToId, collapsedIds } = get();

    const currentActiveStoryData = activeStoryData();

    // desired logic is thus;
    // if opening the comment, scroll to it -- use the comment id
    // if closing the comment, scroll to the next sibling
    // if no sibling, scroll to the next parent
    // when choosing scroll target, skip comments that are collapsed

    updateCollapsedState(id, !newOpen);

    if (newOpen) {
      // For opening, we can scroll immediately
      setScrollToId(id);
      return;
    }

    if (!currentActiveStoryData) {
      return;
    }

    // find the next sibling or scroll to parent if final (or only) node
    // need to traverse the kidsObj to find the next sibling
    const testComments = currentActiveStoryData.kidsObj || [];

    const nextSiblingId = findNextSibling(
      testComments,
      id,
      undefined,
      collapsedIds
    );

    if (nextSiblingId === undefined) {
      return;
    }

    console.log("nextSiblingId", nextSiblingId);

    // For closing, wait for DOM updates to complete before setting scroll target
    requestAnimationFrame(() => {
      // Wait for one more frame to ensure collapse animation has started
      requestAnimationFrame(() => {
        setScrollToId(nextSiblingId);
      });
    });
  },
}));
