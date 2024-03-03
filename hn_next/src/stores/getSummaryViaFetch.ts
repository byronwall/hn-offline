import { ensureUrlIsFullyQualified } from "./ensureUrlIsFullyQualified";
import { HnStorySummary, HnItem } from "./useDataStore";

export async function getSummaryViaFetch(url: string) {
  try {
    url = ensureUrlIsFullyQualified(url);

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("Failed to fetch", { url, env: process.env });
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

export function mapStoriesToSummaries(data: HnItem[] | undefined) {
  if (!data) {
    return undefined;
  }

  return data.map<HnStorySummary>((c) => ({
    id: c.id,
    score: c.score,
    title: c.title,
    url: c.url,
    commentCount: c.descendants,
    time: c.time,
  }));
}
