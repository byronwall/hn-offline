import { STORY_TYPE, type TopStoriesType } from "~/models/interfaces";

import { getItem, getList } from "./database";

// The stories on a list, straight from the DB. Stale stories are still
// served; the refresh loop replaces them.
export function getTopStories(type: TopStoriesType) {
  if (!STORY_TYPE.includes(type)) {
    throw new Error(
      `Invalid type ${type}, expected one of ${STORY_TYPE.join(", ")}`
    );
  }

  const ids = getList(type)?.items ?? [];
  return ids
    .map((id) => getItem(id, { allowStale: true }))
    .filter((item) => item !== null);
}
