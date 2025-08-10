import { makePersisted } from "@solid-primitives/storage";
import { createMemo, createReaction, createSignal } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";

import { LOCAL_FORAGE_TO_USE } from "./localforage";

export type TimestampHash = Record<number, number>;

export const [shouldHideReadItems, setShouldHideReadItems] = makePersisted(
  createSignal(false),
  {
    name: "SHOULD_HIDE_READ_ITEMS",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
  }
);

// Persisted read-items timestamps map, similar to useCommentStore
export const [readItems, setReadItems] = makePersisted(
  createStore<TimestampHash>({}),
  {
    name: "READ_ITEMS",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as any,
    deserialize: (value) => value as unknown as TimestampHash,
  }
);

// After first hydration/change, schedule a cleanup
const hasLength = createMemo(() => Object.keys(readItems).length);
const scheduleCleanup = createReaction(() =>
  setTimeout(() => {
    cleanUpOldReadEntries();
  }, 1000)
);
scheduleCleanup(hasLength);

export function saveIdToReadList(id: number | undefined): void {
  if (!id) {
    return;
  }

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
