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

  // Comment count of each story when it was last read, so lists can show
  // how many comments are new since then.
  const [readCommentCounts, setReadCommentCounts, countsHydrated] =
    createPersistedStore(
      "READ_COMMENT_COUNTS",
      {} as TimestampHash,
      localForage
    );

  const [recentlyReadId, setRecentlyReadId] = createSignal<number | undefined>(
    undefined
  );

  // Prune week-old entries once both stored maps load.
  createEffect(() => {
    if (!readItemsHydrated() || !countsHydrated()) {
      return;
    }
    untrack(() => {
      const kept = dropOldEntries(readItems);
      void setReadItems(kept);
      void setReadCommentCounts(
        Object.fromEntries(
          Object.entries(readCommentCounts).filter(([id]) => id in kept)
        )
      );
    });
  });

  const saveIdToReadList = (id: number, commentCount: number | undefined) => {
    addMessage("readItems", "saveIdToReadList", { id, commentCount });
    void setReadItems(id, Date.now());
    if (commentCount !== undefined) {
      void setReadCommentCounts(id, commentCount);
    }
  };

  // Comments added since the story was last read, or 0 if never read.
  const newCommentCount = (id: number, commentCount: number | undefined) => {
    const seen = readCommentCounts[id];
    if (seen === undefined || commentCount === undefined) {
      return 0;
    }
    return Math.max(0, commentCount - seen);
  };

  return {
    readSettings,
    setReadSettings,
    readItems,
    setReadItems,
    recentlyReadId,
    setRecentlyReadId,
    saveIdToReadList,
    newCommentCount,
  };
}
