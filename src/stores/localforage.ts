import localforage from "localforage";
import { isServer } from "solid-js/web";

if (!isServer) {
  localforage.config({
    driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
    name: "hn_next",
    version: 1.0,
    size: 4980736, // Size of database, in bytes. WebSQL-only for now.
    storeName: "keyvaluepairs", // Should be alphanumeric, with underscores.
    description: "some description",
  });
}

// this is meant to be the primary reference to localforage
// goal is to ensure it's only configured in 1 file
export const LOCAL_FORAGE_TO_USE = localforage;
