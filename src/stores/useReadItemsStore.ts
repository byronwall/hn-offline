import { createEffect, createSignal } from "solid-js";
import { reconcile } from "solid-js/store";
import { isServer } from "solid-js/web";

import { createPersistedStore } from "./createPersistedStore";
import { addMessage } from "./messages";

export type TimestampHash = Record<number, number>;

export const [readSettings, setReadSettings] = createPersistedStore(
  "READ_SETTINGS",
  {
    shouldHideReadItems: false,
  }
);

export const [readItems, setReadItems, { waitingToLoad, isLoaded }] =
  createPersistedStore("READ_ITEMS", {} as TimestampHash);

// Client-only signal for the most recently read story ID
// Not persisted; used to trigger fade-out on return to list
export const [recentlyReadId, setRecentlyReadId] = createSignal<
  number | undefined
>(undefined);

createEffect(() => {
  // recent read id
  // TODO: remove this
  console.warn("*** recentlyReadId", recentlyReadId());
});

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

export async function saveIdToReadList(id: number | undefined): Promise<void> {
  if (!id) {
    return;
  }

  // prevent the store from being accessed before it's ready
  await waitingToLoad;

  addMessage("readItems", "saveIdToReadList", { id });

  setReadItems(id, Date.now());
}

export function cleanUpOldReadEntries(): void {
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
}
