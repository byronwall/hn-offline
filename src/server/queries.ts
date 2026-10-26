import { query } from "@solidjs/router";
import { isServer } from "solid-js/web";

import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { ContentForPage } from "~/stores/useDataStore";

import { getFullDataForIds } from "./getFullDataForIds";
import { getTopStories } from "./getTopStories";

const queryWithServerInfo = <T, A extends unknown[]>(
  queryFn: (...args: A) => Promise<T>,
  key: string
) => {
  return query(async (...args: A) => {
    const data = await queryFn(...args);
    return { result: data, startedFromServer: isServer } as WithServerInfo<T>;
  }, key);
};

export type WithServerInfo<T> = { result: T; startedFromServer: boolean };

export const getStoryById = queryWithServerInfo(async (id: number) => {
  "use server";

  if (!id || Number.isNaN(id)) {
    return null;
  }

  const storyData = await getFullDataForIds([id]);
  const story = (storyData?.[0] as HnItem | null) ?? null;

  return story;
}, "story-by-id");

// Server render uses this: list pages need only the summaries, and full
// comment trees for 30+ stories made the HTML ~1.8 MB.
export const getStorySummariesByType = queryWithServerInfo(
  async (type: TopStoriesType) => {
    "use server";

    const contentObj: ContentForPage = {
      type: "summaryOnly",
      data:
        mapStoriesToSummaries((await getTopStories(type)) as HnItem[]) ?? [],
    };

    return contentObj;
  },
  "story-summaries-by-type"
);

export const getStoryListByType = queryWithServerInfo(
  async (type: TopStoriesType) => {
    "use server";

    const contentObj: ContentForPage = {
      type: "fullData",
      data: (await getTopStories(type)) as HnItem[],
    };

    return contentObj;
  },
  "story-list-by-type"
);
