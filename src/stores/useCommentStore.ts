import { createMemo, createReaction } from "solid-js";
import { reconcile } from "solid-js/store";
import { isServer } from "solid-js/web";

import { createPersistedStore } from "./createPersistedStore";
import { findNextSibling } from "./findNextSibling";
import type { AddMessage } from "./messages";

import type { ActiveStoryStore } from "./activeStorySignal";
import type { ScrollStore } from "./scrollSignal";

export type CollapsedTimestampMap = Record<number, number>;

export type CommentStore = {
  collapsedTimestamps: CollapsedTimestampMap;
  updateCollapsedState: (commentId: number | undefined, collapsed: boolean) => void;
  cleanUpOldEntries: () => void;
  handleCollapseEvent: (id: number, newOpen: boolean) => void;
};

export function createCommentStore(
  params: {
    addMessage: AddMessage;
    localForage: () => LocalForage | undefined;
    activeStory: ActiveStoryStore;
    scroll: ScrollStore;
  }
): CommentStore {
  params.addMessage("commentStore", "init");

  const [collapsedTimestamps, setCollapsedTimestamps] = createPersistedStore(
    "COLLAPSED_COMMENTS",
    {} as CollapsedTimestampMap,
    params.localForage
  );

  // first time the length of the store is >0, call for cleanup 1s later
  // this will fire when the store loads
  const hasLength = createMemo(() => Object.keys(collapsedTimestamps).length);
  const cleanOnChange = createReaction(
    () => !isServer && setTimeout(() => cleanUpOldEntries(), 1000)
  );
  cleanOnChange(hasLength);

  const updateCollapsedState = (
    commentId: number | undefined,
    collapsed: boolean
  ): void => {
    if (!commentId) {
      return;
    }

    const next: CollapsedTimestampMap = { ...collapsedTimestamps };
    if (collapsed) {
      next[commentId] = Date.now();
    } else {
      delete next[commentId];
    }

    setCollapsedTimestamps(reconcile(next, { merge: false }));
  };

  const cleanUpOldEntries = (): void => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const prev = collapsedTimestamps;
    let changed = false;
    const next: CollapsedTimestampMap = { ...prev };
    for (const [idStr, ts] of Object.entries(prev)) {
      if (typeof ts === "number" && ts <= oneWeekAgo) {
        delete next[Number(idStr)];
        changed = true;
      }
    }

    if (changed) {
      setCollapsedTimestamps(reconcile(next, { merge: false }));
    }
  };

  const handleCollapseEvent = (id: number, newOpen: boolean): void => {
    updateCollapsedState(id, !newOpen);

    if (newOpen) {
      params.scroll.setScrollToId(id);
      return;
    }

    const currentActiveStoryData = params.activeStory.activeStoryData();
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
        params.scroll.setScrollToId(nextSiblingId);
      });
    });
  };

  return {
    collapsedTimestamps,
    updateCollapsedState,
    cleanUpOldEntries,
    handleCollapseEvent,
  };
}
