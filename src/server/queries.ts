import { query } from "@solidjs/router";

import { HnItem, TopStoriesType } from "~/models/interfaces";

import { getFullDataForIds } from "./getFullDataForIds";
import { getTopStories } from "./getTopStories";

export const getStoryById = query(async (id: number) => {
  "use server";

  if (!id || Number.isNaN(id)) {
    return null;
  }

  const storyData = await getFullDataForIds([id]);
  return (storyData?.[0] as HnItem | null) ?? null;
}, "story-by-id");

export const getStoryListByType = query(async (type: TopStoriesType) => {
  "use server";

  return (await getTopStories(type)) as HnItem[];
}, "story-list-by-type");
