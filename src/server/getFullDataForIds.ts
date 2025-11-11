"use server";

import { _getUnixTimestamp } from "~/lib/utils";

import { HackerNewsApi } from "./api";
import {
  addChildrenToItemRecurse,
  addItemToDb,
  getItemFromDb,
} from "./database";

import type { Item, ItemExt } from "~/models/interfaces";

export async function getFullDataForIds(itemIDs: number[]) {
  "use server";

  const itemObjects = await Promise.all(itemIDs.map(getItemFromDb));

  for (let i = 0; i < itemObjects.length; i++) {
    const obj = itemObjects[i];

    /// TODO: add a check to the data updated
    if (obj === null) {
      const item = await HackerNewsApi.get().fetchItem(itemIDs[i]);
      if (item === null) {
        continue;
      }
      await addChildrenToItemRecurse(item);
      await addItemToDb(item);

      const root = await resolveRootId(item.id);
      itemObjects[i] = { ...item, root, lastUpdated: _getUnixTimestamp() };
    } else {
      const root = await resolveRootId(obj.id);
      // update both the returned object and DB for consistency
      const updated: ItemExt = {
        ...obj,
        root,
        lastUpdated: _getUnixTimestamp(),
      };
      addItemToDb(updated);
      itemObjects[i] = updated;
    }
  }

  return itemObjects;
}

async function resolveRootId(startId: number): Promise<number> {
  let currentId: number = startId;
  const visited = new Set<number>();

  // walk up via parent until no parent exists (story or top-level comment)
  for (let depth = 0; depth < 1000; depth++) {
    if (visited.has(currentId)) {
      // cycle safety; return the current id
      return currentId;
    }
    visited.add(currentId);

    const current = await getItemOrFetchNoCache(currentId);
    if (current === null) {
      return currentId;
    }

    if (current.parent === undefined) {
      // reached story or top-level comment
      return currentId;
    }

    currentId = current.parent;
  }

  // depth guard fallback
  return currentId;
}

async function getItemOrFetchNoCache(id: number): Promise<ItemExt | null> {
  const fromDb = getItemFromDb(id);
  if (fromDb !== null) {
    return fromDb;
  }

  const fetched: Item | null = await HackerNewsApi.get().fetchItem(id);
  if (fetched === null) {
    return null;
  }

  // do not actually add to db, this does not have all the children
  return {
    ...fetched,
    lastUpdated: _getUnixTimestamp(),
  };
}
