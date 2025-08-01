"use server";

import { _getUnixTimestamp } from "~/lib/utils";

import { HackerNewsApi } from "./api";
import {
  addChildrenToItemRecurse,
  addItemToDb,
  getItemFromDb,
} from "./database";

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

      itemObjects[i] = { ...item, lastUpdated: _getUnixTimestamp() };
    }
  }

  return itemObjects;
}
