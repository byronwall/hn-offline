import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import { createStore, unwrap } from "solid-js/store";

export function createPersistedStore<T extends object>(
  name: string,
  initialValue: T,
  localForage: Accessor<LocalForage | undefined>
) {
  console.log("*** createPersistedStore", { name, initialValue, localForage });
  const [store, rawSetStore] = createStore(initialValue);

  const [hasHydratedFromStorage, setHasHydratedFromStorage] =
    createSignal(false);
  const [storageSnapshot, setStorageSnapshot] = createSignal<{
    value: T | undefined;
    loaded: boolean;
  }>({ value: undefined, loaded: false });

  const pendingMutations: Array<(current: T) => T> = [];

  const queueMutation = (mutation: (current: T) => T) => {
    pendingMutations.push(mutation);
  };

  const setStore = async <K extends keyof T>(
    keyOrNewStore: K | T | ((currentStore: T) => T),
    value?: T[K]
  ) => {
    console.log("*** setting store", name, keyOrNewStore, value);

    // handle setting the store via a function
    if (typeof keyOrNewStore === "function") {
      const mutation = keyOrNewStore as (currentStore: T) => T;
      const newStore = mutation(unwrap(store));
      console.log("*** newStore", newStore);
      rawSetStore(newStore);
      if (hasHydratedFromStorage()) {
        await localForage()?.setItem(name, newStore);
      } else {
        queueMutation(mutation);
      }
      return;
    }

    // handle setting the whole store
    if (typeof keyOrNewStore === "object") {
      const newStore = unwrap(keyOrNewStore);
      console.log("*** keyOrNewStore", newStore);
      rawSetStore(newStore);
      if (hasHydratedFromStorage()) {
        await localForage()?.setItem(name, newStore);
      } else {
        queueMutation(() => newStore);
      }

      return;
    }

    // handle setting a single key
    console.log("setting store", name, keyOrNewStore, value);
    rawSetStore(keyOrNewStore as any, value);
    const mutation = (currentStore: T) => ({
      ...currentStore,
      [keyOrNewStore]: value as T[K],
    });
    if (hasHydratedFromStorage()) {
      await localForage()?.setItem(name, unwrap(store));
    } else {
      queueMutation(mutation);
    }
  };

  createEffect(() => {
    const lf = localForage();
    if (!lf) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const initialValue = (await lf.getItem(name)) as T;
      if (cancelled) {
        return;
      }
      console.log(
        "*** initial value from local forage in resource",
        name,
        initialValue
      );
      setStorageSnapshot({ value: initialValue, loaded: true });
    })();
    onCleanup(() => {
      cancelled = true;
    });
  });

  createEffect(() => {
    const lf = localForage();
    const snapshot = storageSnapshot();
    if (!lf || !snapshot.loaded || hasHydratedFromStorage()) {
      return;
    }

    console.log("*** creating effect to set data", name, snapshot.value);

    const base = snapshot.value ?? initialValue;
    let merged = base;
    if (pendingMutations.length > 0) {
      for (const mutation of pendingMutations) {
        merged = mutation(merged);
      }
    }

    rawSetStore(merged as T);
    setHasHydratedFromStorage(true);

    if (pendingMutations.length > 0) {
      void lf.setItem(name, merged);
    }

    pendingMutations.length = 0;
  });

  return [store, setStore, hasHydratedFromStorage] as const;
}
