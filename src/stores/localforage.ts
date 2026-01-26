import localforage from "localforage";
import { type Accessor, createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import type { AddMessage } from "./messages";

export type LocalForageStore = {
  localForage: Accessor<LocalForage | undefined>;
  initializeLocalForage: () => void;
};

export function createLocalForageStore(
  addMessage: AddMessage
): LocalForageStore {
  const [localForage, setLocalForage] = createSignal<LocalForage | undefined>(
    undefined
  );

  const initializeLocalForage = () => {
    addMessage("localforage", "initializeLocalForage init");

    if (isServer) {
      return;
    }

    localforage.config({
      driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
      name: "hn_next",
      version: 1.0,
      size: 4980736, // Size of database, in bytes. WebSQL-only for now.
      storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
      description: "some description",
    });

    setLocalForage(localforage);

    addMessage("localforage", "initializeLocalForage done");
  };

  return {
    localForage,
    initializeLocalForage,
  };
}
