import { _getUnixTimestamp } from "~/lib/utils";
import { STORY_TYPE, type TopStoriesType } from "~/models/interfaces";

import {
  getList,
  pruneItems,
  putList,
  reloadDatabase,
  saveDatabase,
  state,
} from "./database";
import { getFullDataForIds } from "./getFullDataForIds";
import { fetchListIds } from "./hnSources";

// How old (seconds) each list may get before a refresh. List timestamps live
// in the DB, so the cadence survives restarts.
const LIST_MAX_AGE_S: Record<TopStoriesType, number> = {
  topstories: 10 * 60,
  day: 60 * 60,
  week: 6 * 60 * 60,
};
const CHECK_EVERY_MS = 5 * 60 * 1000;

// Load the DB and start the refresh loop, once per process. Every server
// query calls this; a bare side-effect import would be tree-shaken away
// (package.json has "sideEffects": false).
export function ensureServerStarted() {
  if (!state.loaded) {
    reloadDatabase();
  }
  if (!state.refreshStarted) {
    state.refreshStarted = true;
    console.log("refresh loop started");
    void refreshLoop();
  }
}

// One refresh at a time: the next check is scheduled after this one ends, so
// a slow refresh never overlaps the next.
async function refreshLoop() {
  try {
    await refreshStaleLists();
  } catch (error) {
    console.error("refresh failed", error);
  }
  setTimeout(refreshLoop, CHECK_EVERY_MS);
}

async function refreshStaleLists() {
  const now = _getUnixTimestamp();
  const stale = STORY_TYPE.filter(
    (type) => now - (getList(type)?.lastUpdated ?? 0) > LIST_MAX_AGE_S[type]
  );

  for (const type of stale) {
    console.log(`refreshing ${type}`);
    const started = Date.now();
    const ids = await fetchListIds(type);
    await getFullDataForIds(ids);
    putList(type, ids);
    console.log(
      `refreshed ${type}: ${ids.length} stories in ${Date.now() - started}ms`
    );
  }

  // Keep only stories still on a list; comments live inside their story.
  const keep = new Set(
    STORY_TYPE.flatMap((type) => getList(type)?.items ?? [])
  );
  const removed = pruneItems(keep);
  if (stale.length > 0 || removed > 0) {
    await saveDatabase();
  }
}
