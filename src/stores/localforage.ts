import localforage from "localforage";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

import { addMessage } from "./messages";

// this is meant to be the primary reference to localforage
// goal is to ensure it's only configured in 1 file
export const [LOCAL_FORAGE_TO_USE, setLOCAL_FORAGE_TO_USE] = createSignal<
  LocalForage | undefined
>(undefined);

export function initializeLocalForage() {
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

  setLOCAL_FORAGE_TO_USE(localforage);

  addMessage("localforage", "initializeLocalForage done");
}
