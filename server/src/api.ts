// https://github.com/michaelbull/aurelia-hacker-news/blob/master/src/services/api.ts

import firebase from "firebase";
import DataSnapshot = firebase.database.DataSnapshot;

import { Item } from "./item";

const API_URL = "https://hacker-news.firebaseio.com";
const API_VERSION = "/v0";
export const STORIES_PER_PAGE = 25;

export class HackerNewsApi {
  constructor() {
    console.log("api constructor called");
    this.db = firebase
      .initializeApp({ databaseURL: API_URL })
      .database()
      .ref(API_VERSION);
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
    let start = (page - 1) * STORIES_PER_PAGE;
    let end = page * STORIES_PER_PAGE;
    return this.fetchItems(items.slice(start, end));
  }

  async fetchItems(ids: number[]): Promise<Item[]> {
    let result: Item[] = [];

    for (let id of ids) {
      let item = await this.fetchItem(id);

      if (item !== null) {
        result.push(item);
      }
    }

    return result;
  }

  fetchItemIds(name: string): Promise<number[]> {
    return this.fetch(name);
  }

  fetchItem(id: number): Promise<Item | null> {
    return this.fetch(`item/${id}`);
  }

  private fetch(path: string): Promise<any | null> {
    return new Promise(
      (resolve: (value: any) => void, reject: (reason: any) => void): void => {
        this.db.child(path).once(
          "value",
          (snapshot: DataSnapshot) => {
            resolve(snapshot.val());
          },
          reject
        );
      }
    );
  }
}
