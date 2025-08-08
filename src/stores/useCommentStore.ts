import { makePersisted } from "@solid-primitives/storage";
import localforage from "localforage";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import { activeStoryData } from "./activeStorySignal";
import { findNextSibling } from "./findNextSibling";
import { setScrollToId } from "./scrollSignal";

const LOCAL_COLLAPSED_COMMENTS = "COLLAPSED_COMMENTS";

// Configure localforage on the client
if (typeof window !== "undefined") {
  localforage.config({
    driver: localforage.INDEXEDDB,
    name: "hn_next",
    version: 1.0,
    storeName: "keyvaluepairs",
  });
}

// We keep timestamps in storage for cleanup, but expose a boolean map to consumers.
type CollapsedTimestampMap = Record<number, number>;

const [collapsedTimestamps, setCollapsedTimestamps, initPersist] =
  makePersisted(createSignal<CollapsedTimestampMap>({}), {
    name: LOCAL_COLLAPSED_COMMENTS,
    storage: !isServer ? localforage : undefined,
    // Store objects directly in localforage instead of JSON strings
    // so DevTools shows normal objects and other parts of the app
    // (that also use localforage) remain consistent.
    // makePersisted allows disabling serialization by using identity fns.
    serialize: (value) => value as unknown as string,
    deserialize: (value) => value as unknown as CollapsedTimestampMap,
  });

// Signal indicating when async persisted state has been loaded
export const [isCollapsedStateReady, setIsCollapsedStateReady] =
  createSignal(false);

// Accessor returning a boolean map of collapsed IDs
export const collapsedIds = () => {
  const result: Record<number, true> = {};
  const map = collapsedTimestamps();
  for (const idStr of Object.keys(map)) {
    const id = Number(idStr);
    if (!Number.isNaN(id)) {
      result[id] = true;
    }
  }
  return result;
};

export async function fetchInitialCollapsedState(): Promise<void> {
  // Initialize from async storage if available
  const initFn = initPersist as unknown as (() => Promise<void>) | undefined;
  try {
    if (typeof initFn === "function") {
      await initFn();
    } else if (
      initFn &&
      typeof (initFn as Promise<unknown>).then === "function"
    ) {
      await (initFn as Promise<unknown>);
    }
  } catch (e) {
    console.error("Failed to initialize collapsed comment state", e);
  } finally {
    setIsCollapsedStateReady(true);
  }
  // Clean up old entries shortly after initialization
  setTimeout(() => void cleanUpOldEntries(), 1000);
}

export function updateCollapsedState(
  commentId: number | undefined,
  collapsed: boolean
): void {
  if (!commentId) {
    return;
  }

  setCollapsedTimestamps((prev) => {
    const next: CollapsedTimestampMap = { ...prev };
    if (collapsed) {
      next[commentId] = Date.now();
    } else {
      delete next[commentId];
    }

    return next;
  });
}

export function cleanUpOldEntries(): void {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  setCollapsedTimestamps((prev) => {
    let changed = false;
    const next: CollapsedTimestampMap = { ...prev };
    for (const [idStr, ts] of Object.entries(prev)) {
      if (typeof ts === "number" && ts <= oneWeekAgo) {
        delete next[Number(idStr)];
        changed = true;
      }
    }
    return changed ? next : prev;
  });
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
    collapsedIds()
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
