import { HnItem, HnStorySummary } from "~/stores/useDataStore";

export async function getSummaryViaFetch(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch", { url });
      console.error(response);
      return { data: [], storySummaries: [] as HnStorySummary[] };
    }

    const data = (await response.json()) as HnItem[];

    // replace the list with the new IDs
    const storySummaries = mapStoriesToSummaries(data);

    return { data, storySummaries };
  } catch (e) {
    console.error("Failed to fetch", { url, env: process.env });
    console.error(e);
    return { data: [], storySummaries: [] as HnStorySummary[] };
  }
}

export function mapStoriesToSummaries(
  data: HnItem[] | HnStorySummary[] | undefined
) {
  if (!data || !Array.isArray(data)) {
    return undefined;
  }

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
