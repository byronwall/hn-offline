import { Item } from "./item";

export interface HasTime {
  lastUpdated: number; // UNIX timestamp in seconds
}

export interface TopStories extends HasTime {
  items: number[];
  id: TopStoriesType;
}

export interface ItemExt extends Item, HasTime {
  firstLayerOnly?: boolean;
}

export interface TopStoriesParams {
  type: TopStoriesType;
}

export const STORY_TYPE = ["topstories", "day", "week", "month"] as const;
export type TopStoriesType = typeof STORY_TYPE[number];

export interface ItemParams {
  id: number;
}
