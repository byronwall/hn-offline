import { type Accessor, createEffect, createSignal } from "solid-js";
import { createStore, unwrap } from "solid-js/store";

export function createPersistedStore<T extends object>(
  name: string,
  initialValue: T,
  localForage: Accessor<LocalForage | undefined>
) {
  console.log("*** createPersistedStore", { name, initialValue, localForage });
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
      await localForage()?.setItem(name, newStore);
      return;
    }

    // handle setting the whole store
    if (typeof keyOrNewStore === "object") {
      const newStore = unwrap(keyOrNewStore);
      console.log("*** keyOrNewStore", newStore);
      rawSetStore(newStore);
      await localForage()?.setItem(name, newStore);

      return;
    }

    // handle setting a single key
    console.log("setting store", name, keyOrNewStore, value);
    rawSetStore(keyOrNewStore as any, value);
    await localForage()?.setItem(name, unwrap(store));
  };

  const [initValueFromLocalForage, setInitValueFromLocalForage] = createSignal<
    T | undefined
  >(undefined);

  async function getInitialValueFromLocalForage() {
    const initialValue = (await localForage()?.getItem(name)) as T;
    console.log(
      "*** initial value from local forage in resource",
      name,
      initialValue
    );
    setInitValueFromLocalForage(() => initialValue);
  }

  createEffect(() => {
    void localForage();
    void getInitialValueFromLocalForage();
  });

  createEffect(() => {
    console.log(
      "*** creating effect to set data",
      name,
      initValueFromLocalForage()
    );
    if (initValueFromLocalForage()) {
      rawSetStore(initValueFromLocalForage() as T);
    }
    if (initValueFromLocalForage()) {
      console.log("*** setting is loaded to true", name);
      setIsLoaded(true);
    }
  });

  return [store, setStore, { isLoaded }] as const;
}
