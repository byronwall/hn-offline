import {
  type Accessor,
  createEffect,
  createSignal,
  onCleanup,
  untrack,
} from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";

import { dropConnection } from "./localforage";
import { wait, withRetries } from "./withRetries";

// A Solid store mirrored to one localForage key.
//
// Writes apply to memory at once. Writes made before the stored value loads
// are queued, then replayed over the stored value, so nothing is lost. A
// failed load retries until it works: hydrating with the initial value would
// let the next write overwrite the saved data.
export function createPersistedStore<T extends object>(
  name: string,
  initialValue: T,
  localForage: Accessor<LocalForage | undefined>
) {
  const [store, rawSetStore] = createStore<T>({ ...initialValue });
  const [hydrated, setHydrated] = createSignal(false);
  const pending: Array<(current: T) => T> = [];

  const retry = <R>(lf: LocalForage, operation: () => Promise<R>) =>
    withRetries(operation, (attempt, delayMs, error) => {
      dropConnection(lf, error);
      console.warn("localForage retry", { name, attempt, delayMs });
    });

  const persist = async () => {
    const lf = localForage();
    if (!lf || !hydrated()) {
      return;
    }
    try {
      await retry(lf, () => lf.setItem(name, unwrap(store)));
    } catch (error) {
      console.error("persist failed", { name, error });
    }
  };

  // Set one key (undefined deletes it), or replace the whole value.
  async function setStore<K extends keyof T>(
    key: K,
    value: T[K] | undefined
  ): Promise<void>;
  async function setStore(next: T | ((current: T) => T)): Promise<void>;
  async function setStore<K extends keyof T>(
    keyOrNext: K | T | ((current: T) => T),
    value?: T[K]
  ) {
    const mutation =
      typeof keyOrNext === "function"
        ? keyOrNext
        : typeof keyOrNext === "object"
          ? () => keyOrNext
          : (current: T) => {
              const next = { ...current, [keyOrNext]: value };
              if (value === undefined) {
                delete next[keyOrNext];
              }
              return next;
            };

    rawSetStore(reconcile(mutation(unwrap(store))));

    if (!hydrated()) {
      pending.push(mutation);
      return;
    }
    await persist();
  }

  createEffect(() => {
    const lf = localForage();
    if (!lf || untrack(hydrated)) {
      return;
    }

    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    void (async () => {
      let saved: T | null = null;
      for (let delayMs = 1000; ; delayMs = Math.min(delayMs * 2, 30_000)) {
        try {
          saved = await retry(lf, () => lf.getItem<T>(name));
          break;
        } catch (error) {
          console.error("hydration failed; will retry", { name, error });
          await wait(delayMs);
        }
        if (cancelled) {
          return;
        }
      }
      if (cancelled) {
        return;
      }

      const merged = pending.reduce(
        (acc, mutation) => mutation(acc),
        saved ?? initialValue
      );
      const hadPending = pending.length > 0;
      pending.length = 0;

      rawSetStore(reconcile(merged));
      setHydrated(true);
      if (hadPending) {
        await persist();
      }
    })();
  });

  return [store, setStore, hydrated] as const;
}
