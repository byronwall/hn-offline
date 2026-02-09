import { query } from "@solidjs/router";

import { HnItem, HnStorySummary } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import type { StoryPage } from "~/models/interfaces";

export type FetchPageDependencies = {
  addMessage?: (key: string, message: string, ...args: unknown[]) => void;
  persistStoryList?: (page: StoryPage, data: HnItem[]) => Promise<void> | void;
};

export async function fetchAllStoryDataForPage(
  page: StoryPage,
  options?: {
    force?: boolean;
    addMessage?: FetchPageDependencies["addMessage"];
    persistStoryList?: FetchPageDependencies["persistStoryList"];
  }
): Promise<HnItem[]> {
  options?.addMessage?.("fetchPage", "init", { page });

  const hasQueryCacheEntry = (key: string) => {
    try {
      query.get(key);
      return true;
    } catch (_error) {
      return false;
    }
  };

  try {
    const queryKey = getStoryListByType.keyFor(page);

    if (options?.force) {
      // If this is the first client call after hydration, the key may still
      // live in Solid's SSR payload and be returned once without network.
      // Consume it now, then delete cache, then call again below for a true
      // server fetch in this same refresh cycle.
      if (!hasQueryCacheEntry(queryKey)) {
        await getStoryListByType(page);
      }

      // Force a cache miss so the call below executes the server query.
      query.delete(queryKey);
    }
    const response = await getStoryListByType(page);
    const rawData = response?.result?.data ?? [];

    // remove any nulls or undefineds
    const data = rawData.filter(Boolean);

    // save to localforage after fetching
    if (options?.persistStoryList) {
      await options.persistStoryList(page, data);
    }

    options?.addMessage?.("fetchPage", "done", { page, data: data.length });

    return data;
  } catch (e) {
    console.error("Failed to fetch", { page, env: process.env });
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
