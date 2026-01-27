// https://github.com/michaelbull/aurelia-hacker-news/blob/master/src/services/api.ts

import { initializeApp } from "firebase/app";
import { get, getDatabase, ref } from "firebase/database";

import { Item, ItemExt } from "~/models/interfaces";

const API_URL = "https://hacker-news.firebaseio.com";
const API_VERSION = "/v0";
const STORIES_PER_PAGE = 25;

export class HackerNewsApi {
  constructor() {
    console.log("api constructor called");

    const app = initializeApp({ databaseURL: API_URL });
    this.db = getDatabase(app);
  }
  private db;

  static _instance: HackerNewsApi;
  static get() {
    if (HackerNewsApi._instance === undefined) {
      HackerNewsApi._instance = new HackerNewsApi();
    }

    return HackerNewsApi._instance;
  }

  fetchItemsOnPage(items: number[], page: number): Promise<Item[]> {
    const start = (page - 1) * STORIES_PER_PAGE;
    const end = page * STORIES_PER_PAGE;
    return this.fetchItems(items.slice(start, end));
  }

  async fetchItems(ids: number[]): Promise<Item[]> {
    const result: Item[] = [];

    for (const id of ids) {
      const item = await this.fetchItem(id);

      if (item !== null) {
        result.push(item);
      }
    }

    return result;
  }

  fetchItemIds(name: string): Promise<number[]> {
    return this.fetch(name);
  }

  fetchItem(id: number): Promise<ItemExt | null> {
    return this.fetch(`item/${id}`);
  }

  private fetch(path: string): Promise<any | null> {
    return new Promise(
      (resolve: (value: any) => void, reject: (reason: any) => void): void => {
        // get the item by id from the firebase database using a query
        const itemsRef = ref(this.db, `${API_VERSION}/${path}`);
        get(itemsRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              resolve(snapshot.val());
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            reject(error);
          });
      }
    );
  }
}
