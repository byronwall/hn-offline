import { Comment } from "~/stores/useDataStore";

// Function to get the initial collapsed state, returning a Promise of string[]
export function getInitialCollapsedState(db: IDBDatabase): Promise<number[]> {
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
