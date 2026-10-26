import { _getUnixTimestamp } from "~/lib/utils";

import { getItem, putItem } from "./database";
import { fetchItem } from "./hnSources";

import type { Item, ItemExt } from "~/models/interfaces";

// Stories loaded at once. Each one already fans out a level of comments at a
// time, so a few stories keep the connection busy without flooding it.
const STORY_CONCURRENCY = 6;

// Fresh items from the DB; anything missing or stale is fetched with its
// whole comment tree and saved. Keeps the input order; null for dead ids.
export async function getFullDataForIds(ids: number[]) {
  return mapWithLimit(ids, STORY_CONCURRENCY, async (id) => {
    const cached = getItem(id);
    if (cached) {
      return cached;
    }

    const item = await fetchItem(id);
    if (!item) {
      return null;
    }
    await loadCommentTree(item);

    const full: ItemExt = {
      ...item,
      lastUpdated: _getUnixTimestamp(),
      root: await resolveRootId(item),
    };
    putItem(full);
    return full;
  });
}

// Fill `kidsObj` through the whole tree. Every fetch in one level runs in
// parallel; the next level starts when it lands.
async function loadCommentTree(root: Item) {
  let level: Item[] = [root];
  while (level.length > 0) {
    const children = await Promise.all(
      level.map(async (item) => {
        if (!item.kids?.length) {
          return [];
        }
        const kids = await Promise.all(item.kids.map(fetchItem));
        item.kidsObj = kids.filter((kid): kid is Item => kid !== null);
        delete item.kids;
        return item.kidsObj;
      })
    );
    level = children.flat();
  }
}

// Walk up `parent` links to the story (or top-level comment). Only comments
// opened directly need this; stories have no parent.
async function resolveRootId(item: Item): Promise<number> {
  let current: Item = item;
  for (let depth = 0; depth < 100 && current.parent !== undefined; depth++) {
    const parent =
      getItem(current.parent, { allowStale: true }) ??
      (await fetchItem(current.parent));
    if (!parent) {
      return current.parent;
    }
    current = parent;
  }
  return current.id;
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}
