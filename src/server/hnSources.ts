import { initializeApp } from "firebase/app";
import { type Database, get, getDatabase, ref } from "firebase/database";

import { _getUnixTimestamp } from "~/lib/utils";

import type { Item, TopStoriesType } from "~/models/interfaces";

export const STORIES_PER_LIST = 50;
const DAY_S = 24 * 60 * 60;

// The official HN API is a Firebase database. One SDK connection multiplexes
// the thousands of item reads a refresh makes.
let firebase: Database | undefined;

async function readHn<T>(path: string): Promise<T | null> {
  firebase ??= getDatabase(
    initializeApp({ databaseURL: "https://hacker-news.firebaseio.com" })
  );
  const snapshot = await get(ref(firebase, `/v0/${path}`));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

export const fetchItem = (id: number) => readHn<Item>(`item/${id}`);

// Story ids from Algolia's HN search.
async function searchAlgolia(params: string): Promise<number[]> {
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search?hitsPerPage=${STORIES_PER_LIST}&${params}`
  );
  if (!res.ok) {
    throw new Error(`Algolia ${res.status} for ${params}`);
  }
  const body = (await res.json()) as { hits: { objectID: string }[] };
  return body.hits.map((hit) => Number(hit.objectID));
}

const storiesSince = (seconds: number) =>
  `tags=story&numericFilters=created_at_i>${_getUnixTimestamp() - seconds}`;

export async function fetchListIds(type: TopStoriesType): Promise<number[]> {
  switch (type) {
    case "topstories":
      try {
        const ids = await readHn<number[]>("topstories");
        if (ids) {
          return ids.slice(0, STORIES_PER_LIST);
        }
      } catch (error) {
        console.warn("HN topstories failed, using Algolia front page", error);
      }
      return searchAlgolia("tags=front_page");
    case "day":
      return searchAlgolia(storiesSince(DAY_S));
    case "week":
      return searchAlgolia(storiesSince(7 * DAY_S));
  }
}
