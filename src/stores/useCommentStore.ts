import { createWithSignal } from "solid-zustand";

import {
  getInitialCollapsedState,
  openCommentsDatabase,
} from "~/lib/indexedDb";

import { activeStoryData } from "./activeStorySignal";
import { findNextSibling } from "./findNextSibling";

let db: IDBDatabase | null = null;

export interface Comment {
  id: number;
  collapsed: boolean;
  timestamp: number;
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
  handleCollapseEvent: (
    id: number,
    newOpen: boolean,
    setScrollToId?: (id: number) => void
  ) => void;
};

export const useCommentStore = createWithSignal<
  CommentStore & CommentStoreActions
>((set, get) => ({
  collapsedIds: {},

  fetchInitialCollapsedState: async () => {
    console.log("*** fetchInitialCollapsedState");
    try {
      // Open the indexedDB database if it hasn't been opened yet
      if (!db) {
        db = await openCommentsDatabase();
      }

      const collapsedIdsArr = await getInitialCollapsedState(db);
      const collapsedIds: Record<number, true> = {};

      collapsedIdsArr.forEach((id) => {
        collapsedIds[id] = true;
      });

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

    if (!db) {
      db = await openCommentsDatabase();
    }

    const transaction = db.transaction(["comments"], "readwrite");
    const store = transaction.objectStore("comments");

    if (collapsed) {
      const request = store.put({
        id: commentId,
        collapsed,
        timestamp: Date.now(),
      } as Comment);

      request.onsuccess = function () {
        console.log("Collapse state updated.");
        set((state) => ({
          collapsedIds: { ...state.collapsedIds, [commentId]: true },
        }));
      };

      request.onerror = function () {
        console.error("Error updating collapse state: ", request.error);
      };
    } else {
      const request = store.delete(commentId);

      request.onsuccess = function () {
        console.log("Collapse state removed.");
        set((state) => {
          const newCollapsedIds = { ...state.collapsedIds };
          delete newCollapsedIds[commentId];

          return {
            collapsedIds: newCollapsedIds,
          };
        });
      };

      request.onerror = function () {
        console.error("Error removing collapse state: ", request.error);
      };
    }
  },

  cleanUpOldEntries: async () => {
    if (!db) {
      db = await openCommentsDatabase();
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const transaction = db.transaction(["comments"], "readwrite");
    const store = transaction.objectStore("comments");
    const index = store.index("timestamp");

    const request = index.openCursor(IDBKeyRange.upperBound(oneWeekAgo));

    request.onsuccess = function (event: Event) {
      const cursor = (event.target as IDBRequest).result;

      // log how items are being deleted
      if (cursor) {
        console.log("Cleaning up old entry: ", cursor.value);
      }

      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };

    request.onerror = function () {
      console.error("Error cleaning up old entries: ", request.error);
    };
  },

  handleCollapseEvent(
    id: number,
    newOpen: boolean,
    setScrollToId?: (id: number) => void
  ) {
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
      if (setScrollToId) {
        setScrollToId(id);
      }
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
        if (setScrollToId) {
          setScrollToId(nextSiblingId);
        }
      });
    });
  },
}));
