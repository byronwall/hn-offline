import { revalidate } from "@solidjs/router";

import { getStoryById } from "~/server/queries";
import { addMessage } from "~/stores/messages";
import { persistStoryToStorage, StoryId } from "~/stores/useDataStore";

export async function fetchObjById(
  id: StoryId,
  options?: { force?: boolean }
) {
  addMessage("fetchObjById", "fetching", { id });
  if (options?.force) {
    await revalidate(getStoryById.keyFor(id));
  }
  const data = await getStoryById(id);

  if (!data || "error" in data) {
    console.error(data);

    throw new Error("data is undefined");
  }

  // save to localforage after fetching
  void persistStoryToStorage(id, data); // fire and forget

  addMessage("fetchObjById", "response", { id, source: "query" });

  return data;
}
