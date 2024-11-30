import { create } from "zustand";

// Define the Comment interface used in both the hook and the store
interface Comment {
  id: number;
  collapsed: boolean;
  timestamp: number;
}

// Define the store state interface
interface CommentStore {
  collapsedIds: Record<number, true>;
  fetchInitialCollapsedState: () => void;
  updateCollapsedState: (
    commentId: number | undefined,
    collapsed: boolean
  ) => void;
  cleanUpOldEntries: () => void;
}

let db: IDBDatabase | null = null;

// Create the Zustand store with middleware for devtools
export const useCommentStore = create<CommentStore>()((set) => ({
  collapsedIds: {},

  fetchInitialCollapsedState: async () => {
    console.log("fetchInitialCollapsedState");
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
}));

// Function to get the initial collapsed state, returning a Promise of string[]
function getInitialCollapsedState(db: IDBDatabase): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["comments"], "readonly");
    const store = transaction.objectStore("comments");
    const request = store.openCursor();
    const initialCollapsedIds: number[] = [];

    request.onsuccess = function (event: Event) {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const comment: Comment = cursor.value;
        if (comment.collapsed) {
          initialCollapsedIds.push(comment.id);
        }
        cursor.continue();
      } else {
        resolve(initialCollapsedIds);
      }
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

export function openCommentsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("CommentsDatabase", 1);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (event.oldVersion < 1) {
        // Create object store if it doesn't exist
        const store = db.createObjectStore("comments", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
