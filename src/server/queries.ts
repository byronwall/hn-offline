import { query } from "@solidjs/router";
import { isServer } from "solid-js/web";

import { HnItem, TopStoriesType } from "~/models/interfaces";

import { getFullDataForIds } from "./getFullDataForIds";
import { getTopStories } from "./getTopStories";

export const queryWithServerInfo = <T, A extends unknown[]>(
  queryFn: (...args: A) => Promise<T>,
  key: string
) => {
  return query(async (...args: A) => {
    const data = await queryFn(...args);
    return { result: data, startedFromServer: isServer } as WithServerInfo<T>;
  }, key);
};

type WithServerInfo<T> = { result: T; startedFromServer: boolean };

export const getStoryById = queryWithServerInfo(async (id: number) => {
  "use server";

  if (!id || Number.isNaN(id)) {
    return null;
  }

  const storyData = await getFullDataForIds([id]);
  const story = (storyData?.[0] as HnItem | null) ?? null;

  return story;
}, "story-by-id");

export const getStoryListByType = query(async (type: TopStoriesType) => {
  "use server";

  return (await getTopStories(type)) as HnItem[];
}, "story-list-by-type");
