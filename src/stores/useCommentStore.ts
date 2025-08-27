import { makePersisted } from "@solid-primitives/storage";
import { createMemo, createReaction } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";

import { activeStoryData } from "./activeStorySignal";
import { findNextSibling } from "./findNextSibling";
import { LOCAL_FORAGE_TO_USE } from "./localforage";
import { setScrollToId } from "./scrollSignal";

export type CollapsedTimestampMap = Record<number, number>;

export const [collapsedTimestamps, setCollapsedTimestamps] = makePersisted(
  createStore<CollapsedTimestampMap>({}),
  {
    name: "COLLAPSED_COMMENTS",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as any,
    deserialize: (value) => value as unknown as CollapsedTimestampMap,
  }
);

// first time the length of the store is >0, call for cleanup 1s later
// this will fire when the store loads
const hasLength = createMemo(() => Object.keys(collapsedTimestamps).length);
const cleanOnChange = createReaction(
  () => !isServer && setTimeout(() => cleanUpOldEntries(), 1000)
);
cleanOnChange(hasLength);

export function updateCollapsedState(
  commentId: number | undefined,
  collapsed: boolean
): void {
  if (!commentId) {
    return;
  }

  const next: CollapsedTimestampMap = { ...collapsedTimestamps };
  if (collapsed) {
    next[commentId] = Date.now();
  } else {
    delete next[commentId];
  }
  // Replace the whole store to properly delete keys
  setCollapsedTimestamps(reconcile(next, { merge: false }));
}

export function cleanUpOldEntries(): void {
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
}

export function handleCollapseEvent(id: number, newOpen: boolean): void {
  updateCollapsedState(id, !newOpen);

  if (newOpen) {
    setScrollToId(id);
    return;
  }

  const currentActiveStoryData = activeStoryData();
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
      setScrollToId(nextSiblingId);
    });
  });
}
