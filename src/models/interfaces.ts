export interface HasTime {
  lastUpdated: number; // UNIX timestamp in seconds
}

export interface HasAuthorAndTime {
  by?: string;
  time?: number;
  lastUpdated: number;
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

export const STORY_TYPE = [
  "topstories",
  "day",
  "week",
  "month",
  "offline",
] as const;
export type TopStoriesType = (typeof STORY_TYPE)[number];

export type StoryPage = "topstories" | "day" | "week";

export interface ItemParams {
  id: number;
}
export interface Item {
  /**
   * The item's unique id.
   */
  id: number;

  /**
   * true if the item is deleted.
   */
  deleted?: boolean;

  /**
   * The type of item. One of "job", "story", "comment", "poll", or "pollopt".
   */
  type?: "job" | "story" | "comment" | "poll" | "pollopt";

  /**
   * The username of the item's author.
   */
  by?: string;

  /**
   * Creation date of the item, in Unix Time.
   */
  time?: number;

  /**
   * The comment, story or poll text. HTML.
   */
  text?: string;

  /**
   * true if the item is dead.
   */
  dead?: boolean;

  /**
   * The comment's parent: either another comment or the relevant story.
   */
  parent?: number;

  /**
   * The root story or top-level comment id (walked via parents).
   */
  root?: number;

  /**
   * The pollopt's associated poll.
   */
  poll?: string;

  /**
   * The ids of the item's comments, in ranked display order.
   */
  kids?: number[];

  kidsObj?: Item[];

  /**
   * The URL of the story.
   */
  url?: string;

  /**
   * The story's score, or the votes for a pollopt.
   */
  score?: number;

  /**
   * The title of the story, poll or job.
   */
  title?: string;

  /**
   * A list of related pollopts, in display order.
   */
  parts?: string[];

  /**
   * In the case of stories or polls, the total comment count.
   */
  descendants?: number;
}
export interface HnItem extends HasAuthorAndTime {
  descendants?: number;
  id: number;
  score: number;
  title: string;
  type: string;
  url?: string; // optional for Ask HN and internal items
  kidsObj?: Array<KidsObj3 | null>;
  text?: string; // this is for Ask HN and others that are internal
  by: string; // override to make required
  time: number; // override to make required
  parent?: number; // present when the item is a comment
  root?: number; // root story or top-level comment id
}
export interface KidsObj3 {
  by?: string;
  id: number;
  parent: number;
  text?: string;
  time: number;
  type: string;
  kidsObj?: KidsObj3[];
  deleted?: boolean;
  dead?: boolean;
}
export interface HnStorySummary extends HasAuthorAndTime {
  title?: string;
  score?: number;
  id: number;
  url?: string;
  descendants?: number;
}
