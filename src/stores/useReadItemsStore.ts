import { type Accessor, createEffect, createSignal } from "solid-js";
import { reconcile } from "solid-js/store";
import { isServer } from "solid-js/web";

import { createPersistedStore } from "./createPersistedStore";
import type { AddMessage } from "./messages";

export type TimestampHash = Record<number, number>;

export type ReadItemsStore = {
  readSettings: { shouldHideReadItems: boolean };
  setReadSettings: (
    key: "shouldHideReadItems",
    value: boolean
  ) => Promise<void>;
  readItems: TimestampHash;
  setReadItems: (id: number, value: number) => Promise<void>;
  recentlyReadId: Accessor<number | undefined>;
  setRecentlyReadId: (id: number | undefined) => void;
  saveIdToReadList: (id: number | undefined) => Promise<void>;
  cleanUpOldReadEntries: () => void;
  waitingToLoad: Promise<boolean>;
  isLoaded: Accessor<boolean>;
};

export function createReadItemsStore(
  addMessage: AddMessage,
  localForage: Accessor<LocalForage | undefined>
): ReadItemsStore {
  const [readSettings, setReadSettings] = createPersistedStore(
    "READ_SETTINGS",
    {
      shouldHideReadItems: false,
    },
    localForage
  );

  const [readItems, setReadItems, { waitingToLoad, isLoaded }] =
    createPersistedStore("READ_ITEMS", {} as TimestampHash, localForage);

  const [recentlyReadId, setRecentlyReadId] = createSignal<
    number | undefined
  >(undefined);

  createEffect(() => {
    // recent read id
    // TODO: remove this
    console.warn("*** recentlyReadId", recentlyReadId());
  });

  const cleanUpOldReadEntries = (): void => {
    // Keep only the 7 most recent days of read entries
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const newStore: TimestampHash = {};
    for (const [idStr, ts] of Object.entries(readItems)) {
      if (typeof ts !== "number" || ts < oneWeekAgo) {
        continue;
      }
      newStore[Number(idStr)] = ts;
    }

    setReadItems(reconcile(newStore));
  };

  createEffect(() => {
    if (isLoaded()) {
      addMessage("readItems", "scheduleCleanup init");
      if (!isServer) {
        setTimeout(() => {
          cleanUpOldReadEntries();
        }, 1000);
      }
    }
  });

  const saveIdToReadList = async (id: number | undefined): Promise<void> => {
    if (!id) {
      return;
    }

    // prevent the store from being accessed before it's ready
    await waitingToLoad;

    addMessage("readItems", "saveIdToReadList", { id });

    setReadItems(id, Date.now());
  };

  return {
    readSettings,
    setReadSettings,
    readItems,
    setReadItems,
    recentlyReadId,
    setRecentlyReadId,
    saveIdToReadList,
    cleanUpOldReadEntries,
    waitingToLoad,
    isLoaded,
  };
}
