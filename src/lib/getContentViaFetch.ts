import { HnItem } from "~/models/interfaces";
import { addMessage } from "~/stores/messages";
import { persistStoryToStorage, StoryId } from "~/stores/useDataStore";

export async function fetchObjById(id: StoryId) {
  const url = "/api/story/" + id;

  addMessage("fetchObjById", "fetching", { id });
  const response = await fetch(url);
  if (!response.ok) {
    console.error("Failed to fetch", { url });
    console.error(response);
    throw new Error("Failed to fetch story");
  }

  addMessage("fetchObjById", "response", { id, response: response.status });
  const data: HnItem | { error: string } = await response.json();

  if (!data || "error" in data) {
    console.error(data);

    throw new Error("data is undefined");
  }

  // save to localforage after fetching
  void persistStoryToStorage(id, data); // fire and forget

  return data;
}
