import { type Accessor, createEffect, createSignal } from "solid-js";
import { reconcile } from "solid-js/store";

import { createPersistedStore } from "./createPersistedStore";

import type { AddMessage } from "./messages";

export type TimestampHash = Record<number, number>;

export type ReadItemsStore = ReturnType<typeof createReadItemsStore>;

export function createReadItemsStore(
  addMessage: AddMessage,
  localForage: Accessor<LocalForage | undefined>
) {
  console.log("*** createReadItemsStore", { addMessage, localForage });
  const [readSettings, setReadSettings] = createPersistedStore(
    "READ_SETTINGS",
    {
      shouldHideReadItems: false,
    },
    localForage
  );

  const [readItems, setReadItems, readItemsHydrated] = createPersistedStore(
    "READ_ITEMS",
    {} as TimestampHash,
    localForage
  );

  const [recentlyReadId, setRecentlyReadId] = createSignal<number | undefined>(
    undefined
  );

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

  let hasDoneCleanup = false;
  createEffect(() => {
    if (!readItemsHydrated()) {
      return;
    }
    void readItems;
    if (hasDoneCleanup) {
      return;
    }
    hasDoneCleanup = true;

    addMessage("readItems", "scheduleCleanup init");

    setTimeout(cleanUpOldReadEntries, 1000);
  });

  const saveIdToReadList = async (id: number | undefined): Promise<void> => {
    if (!id) {
      return;
    }

    addMessage("readItems", "saveIdToReadList", { id });

    setReadItems(id, Date.now());
  };

  console.log("*** createReadItemsStore returning");

  return {
    readSettings,
    setReadSettings,
    readItems,
    setReadItems,
    recentlyReadId,
    setRecentlyReadId,
    saveIdToReadList,
    cleanUpOldReadEntries,
  };
}
