import { query } from "@solidjs/router";

import { getStoryById } from "~/server/queries";

import type { HnItem } from "~/models/interfaces";
import type { StoryId } from "~/stores/useDataStore";

export type FetchObjDependencies = {
  addMessage?: (key: string, message: string, ...args: unknown[]) => void;
  persistStoryToStorage?: (
    id: StoryId,
    content: HnItem
  ) => Promise<boolean> | boolean | void;
};

export async function fetchObjById(
  id: StoryId,
  options?: {
    force?: boolean;
    addMessage?: FetchObjDependencies["addMessage"];
    persistStoryToStorage?: FetchObjDependencies["persistStoryToStorage"];
  }
) {
  options?.addMessage?.("fetchObjById", "fetching", { id });

  const hasQueryCacheEntry = (key: string) => {
    try {
      query.get(key);
      return true;
    } catch (_error) {
      return false;
    }
  };

  if (options?.force) {
    const queryKey = getStoryById.keyFor(id);

    // Handle first post-hydration call that can resolve once from SSR payload.
    if (!hasQueryCacheEntry(queryKey)) {
      await getStoryById(id);
    }

    // Force a cache miss so the call below executes the server query.
    query.delete(queryKey);
  }
  const _data = await getStoryById(id);
  const data = _data?.result;

  if (!data || "error" in data) {
    console.error(data);

    throw new Error("data is undefined");
  }

  // save to localforage after fetching
  if (options?.persistStoryToStorage) {
    void options.persistStoryToStorage(id, data); // fire and forget
  }

  options?.addMessage?.("fetchObjById", "response", { id, source: "query" });

  return data;
}
