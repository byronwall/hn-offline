import localforage from "localforage";
import { createWithSignal } from "solid-zustand";

import { activeStoryData } from "./activeStorySignal";
import { findNextSibling } from "./findNextSibling";
import { setScrollToId } from "./scrollSignal";

const LOCAL_COLLAPSED_COMMENTS = "COLLAPSED_COMMENTS";

// Ensure localforage uses IndexedDB driver (still IndexedDB under the hood)
if (typeof window !== "undefined") {
  localforage.config({
    driver: localforage.INDEXEDDB,
    name: "hn_next",
    version: 1.0,
    storeName: "keyvaluepairs",
  });
}

type CommentStore = {
  collapsedIds: Record<number, true>;
};

type CommentStoreActions = {
  fetchInitialCollapsedState: () => void;
  updateCollapsedState: (
    commentId: number | undefined,
    collapsed: boolean
  ) => void;
  cleanUpOldEntries: () => void;
  handleCollapseEvent: (id: number, newOpen: boolean) => void;
};

export const useCommentStore = createWithSignal<
  CommentStore & CommentStoreActions
>((set, get) => ({
  collapsedIds: {},

  fetchInitialCollapsedState: async () => {
    console.log("*** fetchInitialCollapsedState");
    try {
      // Load collapsed state from localforage
      const savedCollapsedMap =
        (await localforage.getItem<Record<number, number>>(
          LOCAL_COLLAPSED_COMMENTS
        )) ?? {};

      const collapsedIds: Record<number, true> = Object.keys(
        savedCollapsedMap
      ).reduce((acc, idStr) => {
        const id = Number(idStr);
        if (!Number.isNaN(id)) {
          acc[id] = true;
        }
        return acc;
      }, {} as Record<number, true>);

      console.log("Initial collapsed state fetched: ", collapsedIds);
      set({ collapsedIds });

      // Clean up old entries in 1 second
      setTimeout(() => {
        set((state) => {
          state.cleanUpOldEntries();
          return state;
        });
      }, 1000);
    } catch (error) {
      console.error("Error fetching initial collapsed states: ", error);
    }
  },

  updateCollapsedState: async (commentId, collapsed) => {
    if (!commentId) {
      return;
    }

    // Read-modify-write the collapsed map stored in localforage
    const savedCollapsedMap =
      (await localforage.getItem<Record<number, number>>(
        LOCAL_COLLAPSED_COMMENTS
      )) ?? {};

    if (collapsed) {
      savedCollapsedMap[commentId] = Date.now();
      await localforage.setItem(LOCAL_COLLAPSED_COMMENTS, savedCollapsedMap);
      console.log("Collapse state updated.");
      set((state) => ({
        collapsedIds: { ...state.collapsedIds, [commentId]: true },
      }));
    } else {
      if (commentId in savedCollapsedMap) {
        delete savedCollapsedMap[commentId];
        await localforage.setItem(LOCAL_COLLAPSED_COMMENTS, savedCollapsedMap);
      }
      console.log("Collapse state removed.");
      set((state) => {
        const newCollapsedIds = { ...state.collapsedIds };
        delete newCollapsedIds[commentId];
        return { collapsedIds: newCollapsedIds };
      });
    }
  },

  cleanUpOldEntries: async () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const savedCollapsedMap =
      (await localforage.getItem<Record<number, number>>(
        LOCAL_COLLAPSED_COMMENTS
      )) ?? {};

    let changed = false;
    for (const [idStr, ts] of Object.entries(savedCollapsedMap)) {
      if (typeof ts === "number" && ts <= oneWeekAgo) {
        console.log("Cleaning up old entry: ", { id: idStr, timestamp: ts });
        delete savedCollapsedMap[Number(idStr)];
        changed = true;
      }
    }

    if (changed) {
      await localforage.setItem(LOCAL_COLLAPSED_COMMENTS, savedCollapsedMap);
    }
  },

  handleCollapseEvent(id: number, newOpen: boolean) {
    const { updateCollapsedState, collapsedIds } = get();

    const currentActiveStoryData = activeStoryData();

    // desired logic is thus;
    // if opening the comment, scroll to it -- use the comment id
    // if closing the comment, scroll to the next sibling
    // if no sibling, scroll to the next parent
    // when choosing scroll target, skip comments that are collapsed

    updateCollapsedState(id, !newOpen);

    if (newOpen) {
      // For opening, we can scroll immediately
      setScrollToId(id);
      return;
    }

    if (!currentActiveStoryData) {
      return;
    }

    // find the next sibling or scroll to parent if final (or only) node
    // need to traverse the kidsObj to find the next sibling
    const testComments = currentActiveStoryData.kidsObj || [];

    const nextSiblingId = findNextSibling(
      testComments,
      id,
      undefined,
      collapsedIds
    );

    if (nextSiblingId === undefined) {
      return;
    }

    console.log("nextSiblingId", nextSiblingId);

    // For closing, wait for DOM updates to complete before setting scroll target
    requestAnimationFrame(() => {
      // Wait for one more frame to ensure collapse animation has started
      requestAnimationFrame(() => {
        setScrollToId(nextSiblingId);
      });
    });
  },
}));
