import { makePersisted } from "@solid-primitives/storage";
import localforage from "localforage";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import { LOCAL_FORAGE_TO_USE } from "./useDataStore";

export type TimestampHash = Record<number, number>;

export const [shouldHideReadItems, setShouldHideReadItems] = makePersisted(
  createSignal(false),
  {
    name: "SHOULD_HIDE_READ_ITEMS",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
  }
);

const LOCAL_READ_ITEMS = "STORAGE_READ_ITEMS";
// Simple signals for read items functionality
export const [readItems, setReadItems] = createSignal<TimestampHash>({});

const [pendingReadItems, setPendingReadItems] = createSignal<number[]>([]);

export const [isLocalForageInitialized, setIsLocalForageInitialized] =
  createSignal(false);

// Action to save an ID to the read list
export const saveIdToReadList = async (id: number) => {
  const currentReadItems = readItems();
  const isInitialized = isLocalForageInitialized();
  const currentPendingItems = pendingReadItems();

  if (!isInitialized) {
    // don't save data before list is loaded --- will clear it
    console.log("localforage not initialized for saveIdToReadList");
    setPendingReadItems([...currentPendingItems, id]);
    return;
  }

  console.log("new read list", currentReadItems);

  // skip out if already there
  if (currentReadItems[id]) {
    return;
  }

  const newReadList = { ...currentReadItems };
  newReadList[id] = Date.now();

  await localforage.setItem(LOCAL_READ_ITEMS, newReadList);
  setReadItems(newReadList);
};

// Initialize from localforage
export const initializeReadItemsFromLocalForage = async () => {
  const isInitialized = isLocalForageInitialized();

  if (isInitialized) {
    console.log("read items already initialized");
    return;
  }

  console.log("initializeReadItemsFromLocalForage");

  const savedReadItems =
    (await localforage.getItem<TimestampHash>(LOCAL_READ_ITEMS)) ?? {};

  const currentPendingItems = pendingReadItems();

  // add any pending items
  for (const id of currentPendingItems) {
    savedReadItems[id] = Date.now();
  }

  console.log("**** initializeReadItemsFromLocalForage done", {
    readItems: savedReadItems,
  });

  setIsLocalForageInitialized(true);
  setReadItems(savedReadItems);
  setPendingReadItems([]);
};

// Purge old read items (used in purgeLocalForage)
export const purgeOldReadItems = async (): Promise<Set<number>> => {
  const currentReadItems = readItems();

  // get the 50 most recent read items
  const readItemsArray = Object.entries(currentReadItems).sort(
    (a, b) => b[1] - a[1]
  );

  console.log("readItemsArray", readItemsArray);

  const idsToKeep = new Set<number>();
  const maxToKeep = Math.min(50, readItemsArray.length);

  for (let i = 0; i < maxToKeep; i++) {
    idsToKeep.add(Number(readItemsArray[i][0]));
  }

  return idsToKeep;
};
