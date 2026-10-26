import { createEffect, untrack } from "solid-js";

import { createPersistedStore } from "./createPersistedStore";
import { dropOldEntries } from "./dropOldEntries";
import { findNextSibling } from "./findNextSibling";

import type { AddMessage } from "./messages";
import type { createStoryUiStore } from "./storyUiStore";

type CollapsedTimestampMap = Record<number, number>;

export function createCommentStore(params: {
  addMessage: AddMessage;
  localForage: () => LocalForage | undefined;
  storyUi: ReturnType<typeof createStoryUiStore>;
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

  const handleCollapseEvent = (id: number, newOpen: boolean): void => {
    updateCollapsedState(id, !newOpen);

    if (newOpen) {
      params.storyUi.setScrollToId(id);
      return;
    }

    const currentActiveStoryData = params.storyUi.activeStoryData();
    if (!currentActiveStoryData) {
      return;
    }

    const testComments = currentActiveStoryData.kidsObj || [];
    const nextSiblingId = findNextSibling(
      testComments,
      id,
      undefined,
      collapsedTimestamps
    );

    if (nextSiblingId === undefined) {
      return;
    }

    // For closing, wait for DOM updates to complete before setting scroll target
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        params.storyUi.setScrollToId(nextSiblingId);
      });
    });
  };

  return {
    collapsedTimestamps,
    updateCollapsedState,
    handleCollapseEvent,
  };
}
