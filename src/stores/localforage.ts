import localforage from "localforage";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import type { AddMessage } from "./messages";

export function createLocalForageStore(addMessage: AddMessage) {
  const [localForage, setLocalForage] = createSignal<LocalForage | undefined>(
    undefined
  );
  const [isReady, setIsReady] = createSignal(false);
  let isInitializing = false;
  let initRetryAttempt = 0;

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
          initRetryAttempt = 0;
          addMessage("localforage", "initializeLocalForage ready");
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
    initializeLocalForage,
  };
}
