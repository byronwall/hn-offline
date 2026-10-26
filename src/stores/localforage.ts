import localforage from "localforage";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import type { AddMessage } from "./messages";

// Close a dead IndexedDB connection so localforage opens a new one. Safari
// drops connections while the app sits in the background, and then every
// call fails with "UnknownError: Connection to Indexed Database server lost"
// until the page reloads. localforage reconnects when it finds the
// connection closed, so the retry succeeds. Close only on UnknownError:
// closing on every retry would also close a healthy connection.
export function dropConnection(lf: LocalForage, error: unknown) {
  if ((error as { name?: string } | undefined)?.name !== "UnknownError") {
    return;
  }
  try {
    (lf as { _dbInfo?: { db?: IDBDatabase } })._dbInfo?.db?.close();
  } catch {
    // already closed
  }
}

export function createLocalForageStore(addMessage: AddMessage) {
  const [localForage, setLocalForage] = createSignal<LocalForage | undefined>(
    undefined
  );
  const [isReady, setIsReady] = createSignal(false);
  let isInitializing = false;
  let initRetryAttempt = 0;
  let resolveReady: (lf: LocalForage) => void = () => {};
  const readyPromise = new Promise<LocalForage>((resolve) => {
    resolveReady = resolve;
  });

  // Storage once it opens, or undefined after timeoutMs. Callers must not
  // treat "not open yet" as "no data" or "saved".
  const whenReady = (timeoutMs = 5000) =>
    Promise.race([
      readyPromise,
      new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);

  const initializeLocalForage = () => {
    addMessage("localforage", "initializeLocalForage init");

    if (isServer) {
      return;
    }

    localforage.config({
      driver: localforage.INDEXEDDB,
      name: "hn_next",
      version: 1.0,
      size: 4980736, // Size of database, in bytes. WebSQL-only for now.
      storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
      description: "some description",
    });

    const tryInitialize = () => {
      if (isReady() || isInitializing) {
        return;
      }

      isInitializing = true;
      initRetryAttempt += 1;

      void localforage
        .setDriver(localforage.INDEXEDDB)
        .then(async () => {
          await localforage.ready();
          setLocalForage(localforage);
          setIsReady(true);
          resolveReady(localforage);
          initRetryAttempt = 0;
          addMessage("localforage", "initializeLocalForage ready");
          // In the installed app, ask the browser not to evict saved
          // stories; Safari otherwise clears them after days of disuse. A
          // Firefox tab would show a permission prompt, so skip tabs.
          if (matchMedia("(display-mode: standalone)").matches) {
            void navigator.storage?.persist?.().catch(() => {});
          }
        })
        .catch((error: unknown) => {
          const delayMs = Math.min(30000, 500 * 2 ** (initRetryAttempt - 1));
          console.error("localForage init failed; will retry", {
            error,
            initRetryAttempt,
            delayMs,
          });
          addMessage("localforage", "initializeLocalForage retrying", {
            attempt: initRetryAttempt,
            delayMs,
          });
          setTimeout(tryInitialize, delayMs);
        })
        .finally(() => {
          isInitializing = false;
        });
    };

    tryInitialize();

    addMessage("localforage", "initializeLocalForage done");
  };

  return {
    localForage,
    isReady,
    whenReady,
    initializeLocalForage,
  };
}
