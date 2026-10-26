import { type Accessor, createEffect, createSignal, untrack } from "solid-js";

import { createPersistedStore } from "./createPersistedStore";
import { dropOldEntries } from "./dropOldEntries";

import type { AddMessage } from "./messages";

type TimestampHash = Record<number, number>;

export type ReadItemsStore = ReturnType<typeof createReadItemsStore>;

export function createReadItemsStore(
  addMessage: AddMessage,
  localForage: Accessor<LocalForage | undefined>
) {
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

  // Prune week-old entries once the stored map loads.
  createEffect(() => {
    if (readItemsHydrated()) {
      void setReadItems(untrack(() => dropOldEntries(readItems)));
    }
  });

  const saveIdToReadList = async (id: number | undefined): Promise<void> => {
    if (!id) {
      return;
    }

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
  };
}
