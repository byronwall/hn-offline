import { createEffect, createResource, createSignal } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { isServer } from "solid-js/web";

import { LOCAL_FORAGE_TO_USE } from "./localforage";

export function createPersistedStore<T extends object>(
  name: string,
  initialValue: T
) {
  const [store, rawSetStore] = createStore(initialValue);
  const [isLoaded, setIsLoaded] = createSignal(false);

  const setStore = async <K extends keyof T>(
    keyOrNewStore: K | T | ((currentStore: T) => T),
    value?: T[K]
  ) => {
    console.log("*** setting store", name, keyOrNewStore, value);

    // handle setting the store via a function
    if (typeof keyOrNewStore === "function") {
      const newStore = keyOrNewStore(unwrap(store));
      console.log("*** newStore", newStore);
      rawSetStore(newStore);
      await LOCAL_FORAGE_TO_USE()?.setItem(name, newStore);
      return;
    }

    // handle setting the whole store
    if (typeof keyOrNewStore === "object") {
      const newStore = unwrap(keyOrNewStore);
      console.log("*** keyOrNewStore", newStore);
      rawSetStore(newStore);
      await LOCAL_FORAGE_TO_USE()?.setItem(name, newStore);

      return;
    }

    // handle setting a single key
    console.log("setting store", name, keyOrNewStore, value);
    rawSetStore(keyOrNewStore as any, value);
    await LOCAL_FORAGE_TO_USE()?.setItem(name, unwrap(store));
  };

  if (!isServer) {
    // kind of a cop out but we know it's only client side
    const [initValueFromLocalForage] = createResource(
      LOCAL_FORAGE_TO_USE,
      async (localForage) => {
        console.log("*** resource running local forage", name, localForage);
        const initialValue = await localForage?.getItem(name);
        console.log(
          "*** initial value from local forage in resource",
          name,
          initialValue
        );
        return initialValue as T;
      }
    );

    createEffect(() => {
      console.log(
        "*** creating effect to set data",
        name,
        initValueFromLocalForage(),
        initValueFromLocalForage.state
      );
      if (initValueFromLocalForage()) {
        rawSetStore(initValueFromLocalForage() as T);
      }
      if (initValueFromLocalForage.state === "ready") {
        console.log("*** setting is loaded to true", name);
        setIsLoaded(true);
      }
    });
  }

  // promise that resolves when the store is loaded
  // this is used in async functions to pause until the store is loaded
  const waitingToLoad = new Promise<boolean>((resolve) => {
    createEffect(() => {
      if (isLoaded()) {
        console.log("*** waiting to load resolving", name);
        resolve(true);
      }
    });
  });

  return [store, setStore, { isLoaded, waitingToLoad }] as const;
}
