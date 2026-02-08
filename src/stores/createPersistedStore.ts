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
  const [pendingPersistValue, setPendingPersistValue] = createSignal<
    T | undefined
  >(undefined);

  const queueMutation = (mutation: (current: T) => T) => {
    pendingMutations.push(mutation);
  };

  const wait = (delayMs: number) =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });

  const withLocalForageRetries = async <R>(
    operationName: string,
    operation: () => Promise<R>,
    maxAttempts = 3
  ): Promise<R> => {
    let latestError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        latestError = error;
        if (attempt >= maxAttempts) {
          break;
        }

        const delayMs = 250 * 2 ** (attempt - 1);
        console.warn("*** localForage retry", {
          name,
          operationName,
          attempt,
          delayMs,
        });
        await wait(delayMs);
      }
    }

    throw latestError;
  };

  const persistSnapshot = async (
    lf: LocalForage | undefined,
    snapshot: T
  ): Promise<boolean> => {
    if (!lf) {
      setPendingPersistValue(() => snapshot);
      return false;
    }

    try {
      await withLocalForageRetries("setItem", async () => {
        await lf.setItem(name, snapshot);
      });
      setPendingPersistValue(() => undefined);
      return true;
    } catch (error) {
      console.error("*** persist failed", { name, error });
      setPendingPersistValue(() => snapshot);
      return false;
    }
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
        await persistSnapshot(localForage(), newStore);
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
        await persistSnapshot(localForage(), newStore);
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
      await persistSnapshot(localForage(), unwrap(store));
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
      let initialValueFromStorage: T | undefined;
      try {
        initialValueFromStorage = (await withLocalForageRetries(
          "getItem",
          async () => (await lf.getItem(name)) as T
        )) as T;
      } catch (error) {
        console.error("*** hydration failed", { name, error });
      }
      if (cancelled) {
        return;
      }
      console.log(
        "*** initial value from local forage in resource",
        name,
        initialValueFromStorage
      );
      setStorageSnapshot({ value: initialValueFromStorage, loaded: true });
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
      void persistSnapshot(lf, merged);
    }

    const pendingSnapshot = pendingPersistValue();
    if (pendingSnapshot !== undefined) {
      void persistSnapshot(lf, pendingSnapshot);
    }

    pendingMutations.length = 0;
  });

  return [store, setStore, hasHydratedFromStorage] as const;
}
