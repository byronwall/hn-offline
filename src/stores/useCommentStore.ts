import { createEffect, untrack } from "solid-js";

import { createPersistedStore } from "./createPersistedStore";
import { dropOldEntries } from "./dropOldEntries";

import type { AddMessage } from "./messages";

type CollapsedTimestampMap = Record<number, number>;

// Which comments (and story texts) the reader collapsed, by id.
export function createCommentStore(params: {
  addMessage: AddMessage;
  localForage: () => LocalForage | undefined;
}) {
  params.addMessage("commentStore", "init");

  const [collapsedTimestamps, setCollapsedTimestamps, hydrated] =
    createPersistedStore(
      "COLLAPSED_COMMENTS",
      {} as CollapsedTimestampMap,
      params.localForage
    );

  // Prune week-old entries once the stored map loads.
  createEffect(() => {
    if (hydrated()) {
      void setCollapsedTimestamps(
        untrack(() => dropOldEntries(collapsedTimestamps))
      );
    }
  });

  const updateCollapsedState = (commentId: number, collapsed: boolean) => {
    void setCollapsedTimestamps(commentId, collapsed ? Date.now() : undefined);
  };

  return {
    collapsedTimestamps,
    updateCollapsedState,
  };
}
