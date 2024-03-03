import { HnStorySummary, HnItem } from "./useDataStore";

export async function getSummaryViaFetch(url: string) {
  const publicPrefix = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!url.startsWith(publicPrefix)) {
    url = publicPrefix + url;
  }

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    console.error("Failed to fetch", url);
    console.error(response);
    return { data: [], storySummaries: [] as HnStorySummary[] };
  }

  const data = (await response.json()) as HnItem[];

  // replace the list with the new IDs
  const storySummaries = mapStoriesToSummaries(data);

  return { data, storySummaries };
}

export function mapStoriesToSummaries(data: HnItem[]) {
  return data.map<HnStorySummary>((c) => ({
    id: c.id,
    score: c.score,
    title: c.title,
    url: c.url,
    commentCount: c.descendants,
    time: c.time,
  }));
}
