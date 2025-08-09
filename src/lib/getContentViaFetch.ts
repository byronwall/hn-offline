import { HnItem } from "~/models/interfaces";
import { StoryId } from "~/stores/useDataStore";

export async function getContentViaFetch(id: StoryId) {
  const url = "/api/story/" + id;

  const response = await fetch(url);
  if (!response.ok) {
    console.error("Failed to fetch", { url });
    console.error(response);
    return undefined;
  }
  const data: HnItem | { error: string } = await response.json();

  if (!data || "error" in data) {
    console.error(data);

    return undefined;
  }

  return data;
}
