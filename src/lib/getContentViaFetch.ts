import { revalidate } from "@solidjs/router";

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
  if (options?.force) {
    await revalidate(getStoryById.keyFor(id));
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
