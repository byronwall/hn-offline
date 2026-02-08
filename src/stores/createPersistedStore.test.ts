// -----------------------------------------------------------------------------
// Persisted Store Hydration Goals
//
//   Local updates before storage ready should be queued,
//   then merged on hydration without losing in-memory changes.
//
//   +--------------------+     +---------------------+
//   | In-memory updates  | --> |   Pending queue     |
//   +--------------------+     +---------------------+
//              |                         |
//              |                         v
//              |                +---------------------+
//              |                | LocalForage loads   |
//              |                +---------------------+
//              |                         |
//              +-------------------------v
//                             +---------------------+
//                             | Merge + persist     |
//                             +---------------------+
// -----------------------------------------------------------------------------
import { renderHook } from "@solidjs/testing-library";
import * as localforage from "localforage";
import { createEffect, createSignal, runWithOwner } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import { createPersistedStore } from "./createPersistedStore";

type LocalForage = typeof localforage;

describe("createPersistedStore", () => {
  it("queues updates before localForage is ready and merges once hydrated", async () => {
    let resolveGetItem: ((value: { a: number; b: number }) => void) | undefined;
    const getItemPromise = new Promise<{ a: number; b: number }>((resolve) => {
      resolveGetItem = resolve;
    });
    const getItem = vi.fn().mockReturnValue(getItemPromise);
    const setItem = vi.fn().mockResolvedValue(undefined);
    const mockLocalForage = {
      getItem,
      setItem,
    } as unknown as LocalForage;

    const { result, owner, cleanup } = renderHook(() => {
      const [localForage, setLocalForage] = createSignal<
        LocalForage | undefined
      >(undefined);
      const [store, setStore, hasHydrated] = createPersistedStore(
        "TEST_STORE",
        {
          a: 0,
          b: 0,
        },
        localForage
      );

      return {
        store,
        setStore,
        hasHydrated,
        setLocalForage,
      };
    });

    await result.setStore("a", 1);
    await result.setStore((current) => ({ ...current, b: 3 }));

    expect(result.store.a).toBe(1);
    expect(result.store.b).toBe(3);
    expect(setItem).not.toHaveBeenCalled();

    if (!resolveGetItem) {
      throw new Error("Missing getItem resolver");
    }

    runWithOwner(owner, () => {
      result.setLocalForage(mockLocalForage);
      resolveGetItem?.({ a: 5, b: 2 });
    });

    await getItemPromise;
    await new Promise<void>((resolve) => {
      runWithOwner(owner, () => {
        createEffect(() => {
          if (result.hasHydrated()) {
            resolve();
          }
        });
      });
    });

    expect(result.hasHydrated()).toBe(true);
    expect(result.store.a).toBe(1);
    expect(result.store.b).toBe(3);
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith("TEST_STORE", {
      a: 1,
      b: 3,
    });

    await result.setStore("b", 9);

    expect(result.store.b).toBe(9);
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(setItem).toHaveBeenLastCalledWith("TEST_STORE", {
      a: 1,
      b: 9,
    });

    cleanup();
  });

  it("does not throw when hydration or persistence fails", async () => {
    const getItem = vi.fn().mockRejectedValue(new Error("indexedDB failed"));
    const setItem = vi.fn().mockRejectedValue(new Error("indexedDB failed"));
    const mockLocalForage = {
      getItem,
      setItem,
    } as unknown as LocalForage;

    const { result, owner, cleanup } = renderHook(() => {
      const [localForage, setLocalForage] = createSignal<
        LocalForage | undefined
      >(undefined);
      const [store, setStore, hasHydrated] = createPersistedStore(
        "TEST_STORE_FAIL",
        { a: 0 },
        localForage
      );

      return {
        store,
        setStore,
        hasHydrated,
        setLocalForage,
      };
    });

    runWithOwner(owner, () => {
      result.setLocalForage(mockLocalForage);
    });

    await new Promise<void>((resolve) => {
      runWithOwner(owner, () => {
        createEffect(() => {
          if (result.hasHydrated()) {
            resolve();
          }
        });
      });
    });

    await expect(result.setStore("a", 5)).resolves.toBeUndefined();
    expect(result.store.a).toBe(5);

    cleanup();
  });
});
