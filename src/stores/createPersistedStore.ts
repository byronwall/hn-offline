import { createEffect, createResource, createSignal, untrack } from "solid-js";
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
    // handle setting the store via a function
    if (typeof keyOrNewStore === "function") {
      const newStore = unwrap(keyOrNewStore(store));
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

  createEffect(() => {
    console.log("local forage", LOCAL_FORAGE_TO_USE());
    if (LOCAL_FORAGE_TO_USE()) {
      setIsLoaded(true);
    }
  });

  if (!isServer) {
    // kind of a cop out but we know it's only client side
    const [initValueFromLocalForage] = createResource(
      LOCAL_FORAGE_TO_USE(),
      async (localForage) => {
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
      console.log("*** creating effect to set data", name);
      if (initValueFromLocalForage()) {
        rawSetStore(initValueFromLocalForage() as T);
      }
    });
  }

  return [store, setStore, isLoaded] as const;
}
