import { HnItem, HnStorySummary } from "~/models/interfaces";
import { addMessage } from "~/stores/messages";
import { persistStoryList, StoryPage } from "~/stores/useDataStore";

export async function fetchAllStoryDataForPage(
  page: StoryPage
): Promise<HnItem[]> {
  addMessage("fetchPage", "init", { page });

  const url = "/api/topstories/" + page;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch", { url });
      console.error(response);
      return [];
    }

    const rawData = (await response.json()) as HnItem[];

    // remove any nulls or undefineds
    const data = rawData.filter(Boolean);

    // save to localforage after fetching
    void persistStoryList(page, data);

    addMessage("fetchPage", "done", { page, data: data.length });

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

  console.log("*** mapping stories to summaries", data.length);

  // this really exists to remove the kidsObj from the data
  // this allows us to store the info in a very compact format
  return data.filter(Boolean).map<HnStorySummary>((c) => ({
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
