import * as path from "path";

import {
  _getFullDataForIds,
  db_clearOldStories,
  db_getTopStoryIds,
  getItemFromDb,
  reloadDatabase,
  saveDatabase,
} from "./database";
import { ItemExt, STORY_TYPE, TopStoriesType } from "../models/interfaces";

const log = console.log;

export const cachedData: { [key: string]: ItemExt[] | null } = {};

const env = process.env.NODE_ENV || "development";

reloadDatabase();

setInterval(updateData, 10 * 60 * 1000);
updateData();

let index = 0;
async function updateData() {
  await loadFreshDataForStoryType("topstories");

  if (index % 6 === 0) {
    // every hour
    await loadFreshDataForStoryType("day");
  }
  if (index % (6 * 6) === 0) {
    // every 6 hours
    await loadFreshDataForStoryType("week");
  }
  if (index % (6 * 24) === 0) {
    // every 24 hours -- only used to clean up history now
    await loadFreshDataForStoryType("month");
    index = 1;
  }

  index++;
}

async function loadFreshDataForStoryType(storyType: TopStoriesType) {
  log(new Date(), "calling for update to", storyType);

  // clear out old stories as needed -- will happen daily
  if (storyType === "month") {
    log("clearing old stories");
    const idsToKeep = new Set<number>();
    for (const key of Object.keys(cachedData)) {
      cachedData[key]!.forEach((story) => {
        if (story === null) {
          return;
        }
        idsToKeep.add(story.id);
      });
    }

    const idArr = Array.from(idsToKeep);
    log("keeping IDs", idArr);
    const removeCount = await db_clearOldStories(idArr);
    log("removed stories: " + removeCount);
  } else {
    // get the data
    const results = await db_getTopStoryIds(storyType).then((ids) => {
      return _getFullDataForIds(ids);
    });

    // save result to local cache... will be served
    cachedData[storyType] = results as ItemExt[];
  }

  saveDatabase();
  log(new Date(), "update complete", storyType);
}
