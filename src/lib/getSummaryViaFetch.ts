import { HnItem, HnStorySummary } from "~/models/interfaces";
import { StoryPage } from "~/stores/useDataStore";

export async function getAllStoryDataForPage(
  page: StoryPage
): Promise<HnItem[]> {
  const url = "/api/topstories/" + (page === "front" ? "topstories" : page);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch", { url });
      console.error(response);
      return [];
    }

    const data = (await response.json()) as HnItem[];

    return data;
  } catch (e) {
    console.error("Failed to fetch", { url, env: process.env });
    console.error(e);
    return [];
  }
}

export function mapStoriesToSummaries(
  data: HnItem[] | HnStorySummary[] | undefined
) {
  if (!data || !Array.isArray(data)) {
    return undefined;
  }

  // this really exists to remove the kidsObj from the data
  // this allows us to store the info in a very compact format
  return data.map<HnStorySummary>((c) => ({
    id: c.id,
    score: c.score,
    title: c.title,
    url: c.url,
    descendants: c.descendants,
    by: c.by,
    time: c.time,
    lastUpdated: c.lastUpdated,
  }));
}
