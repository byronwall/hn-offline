import localforage from "localforage";
import _ from "lodash";
import { Container } from "unstated";

import { HnListSource, TrueHash } from "./App";
import { SESSION_COLLAPSED } from "./HnStoryPage";

interface DataLayerState {
  activeListType: HnListSource | undefined;

  activeList: HnStorySummary[];

  isLoadingNewData: boolean;
  isLoadingLocalStorage: boolean;

  readItems: TrueHash;

  storyKey: number;
}

export interface DataList {
  key: HnListSource;

  storyHeadlines: HnStorySummary[];
}

export interface HnStorySummary {
  title: string;
  score: number;
  id: number;
  url: string | undefined;
  commentCount: number | undefined;
  time: number;
}

const LOCAL_READ_ITEMS = "STORAGE_READ_ITEMS";
export class DataLayer extends Container<DataLayerState> {
  pendingReadItems: number[] = [];

  constructor() {
    super();

    // run through some initial stuff?

    this.initializeFromLocalStorage();
    // load from local storage on creation

    this.state = {
      isLoadingNewData: false,
      activeList: [],

      isLoadingLocalStorage: true,

      readItems: {},
      activeListType: undefined,

      storyKey: 0,
    };
  }

  async executeSearch(searchTerm: string) {
    console.log("execute search", searchTerm);

    // get the stories
    this.updateIsLoadingStatus(true);
    const storyData = await this.api_getSearchResults(searchTerm);

    if (storyData === undefined) {
      this.updateIsLoadingStatus(false);
      return;
    }

    console.log("searhc results", storyData);

    this.updateIsLoadingStatus(false);

    this.setState({
      activeList: storyData,
      activeListType: HnListSource.Search,
    });

    // update the story list
  }

  async initializeFromLocalStorage() {
    console.log("loading from local storage");
    this.setState({ isLoadingLocalStorage: true });

    // add the promise so that others can await them too

    const readItems = await localforage.getItem<TrueHash>(LOCAL_READ_ITEMS);

    console.log("loaded from local storage");

    this.setState({
      isLoadingLocalStorage: false,
      readItems: readItems ?? {},
    });

    this.pendingReadItems.forEach((id) => this.saveIdToReadList(id));
    this.pendingReadItems = [];

    if (this.state.activeListType !== undefined) {
      this.updateActiveList(this.state.activeListType);
    }

    this.pruneLocalStorage();
  }
  async pruneLocalStorage() {
    // this will go through the known lists and remove any stories that are not needed now

    const keys = await localforage.keys();

    const listProm = keys
      .filter((key) => key.startsWith("STORIES_"))
      .map((key) => {
        return localforage.getItem<HnStorySummary[]>(key);
      });

    const storyLists = await Promise.all(listProm);

    const allKnownIds = _.flatten(storyLists)
      .filter((c) => c !== null)
      .map((c) => c!.id + "");

    // remove those ids from the keys array above

    const keysToRemove = keys
      .filter((c) => !c.startsWith("STORIES_"))
      .filter((c) => c !== LOCAL_READ_ITEMS)
      .filter((c) => !_.includes(allKnownIds, c));

    console.log("going to prune", keysToRemove);

    keysToRemove.forEach((c) => localforage.removeItem(c));
  }

  saveIdToReadList(id: number): void {
    if (this.state.isLoadingLocalStorage) {
      // don't save data before list is loaded --- will clear it
      console.log("do not update read list... pending updates");
      this.pendingReadItems.push(id);
      return;
    }
    const newReadList = _.cloneDeep(this.state.readItems);
    console.log("new read list", newReadList);

    // skip out if already there
    if (newReadList[id]) {
      return;
    }

    newReadList[id] = true;

    localforage.setItem(LOCAL_READ_ITEMS, newReadList);

    // ensure the new item is taken
    this.setState((prevState) => {
      return { readItems: newReadList };
    });
  }

  async getStoryData(id: number) {
    // load story from local storage or server
    let item = await localforage.getItem<HnItem>(id + "");

    if (item !== null) {
      return item;
    }

    // hit the API for the story data
    return await this.getStoryFromServer(id);
  }

  public async api_getSearchResults(query: string) {
    let url = "/api/search/" + encodeURIComponent(query);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(response);
      return undefined;
    }
    const data: HnStorySummary[] | { error: string } = await response.json();

    if ("error" in data) {
      console.error(data);

      return undefined;
    }

    console.log("hn item from search", data);

    return data;
  }

  public async getStoryFromServer(id: number) {
    let url = "/api/story/" + id;

    this.updateIsLoadingStatus(true);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(response);
      return undefined;
    }
    const data: HnItem | { error: string } = await response.json();

    if ("error" in data) {
      console.error(data);
      this.updateIsLoadingStatus(false);
      return undefined;
    }

    console.log("hn item from server", data);

    this.updateIsLoadingStatus(false);

    // ensure new story is saved locally
    localforage.setItem(id + "", data);

    return data;
  }
  updateIsLoadingStatus(isLoading: boolean) {
    this.setState({ isLoadingNewData: isLoading });
  }

  async reloadStoryById(id: number) {
    await this.clearItemData(id);

    // this should force a render of the story page
    this.setState((prevState) => {
      return { storyKey: prevState.storyKey + 1 };
    });
  }

  async clearItemData(id: number) {
    const itemRemoved = await localforage.getItem<HnItem>(id + "");

    if (itemRemoved === null) {
      return;
    }

    await localforage.removeItem(id + "");

    // need to clear any collpased ids also
    if (itemRemoved !== undefined) {
      // get all child ids

      const itemsToCheck: (HnItem | KidsObj3)[] = [itemRemoved];

      const strIds = sessionStorage.getItem(SESSION_COLLAPSED);

      if (strIds !== null) {
        const collapsedIds = JSON.parse(strIds) as number[];

        const collapseHash = new Set(collapsedIds);

        while (itemsToCheck.length) {
          const item = itemsToCheck.shift();

          if (item === undefined) {
            continue;
          }

          // remove if collapsed
          if (collapseHash.has(item.id)) {
            collapseHash.delete(item.id);
          }

          item.kidsObj
            ?.filter((c) => c !== null)
            .forEach((c) => itemsToCheck.push(c!));
        }

        const newCollapse = Array.from(collapseHash);

        console.log("old collapse", collapsedIds, newCollapse);

        sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newCollapse));
      }
    }
  }

  async updateActiveList(source: HnListSource) {
    // TODO: add loading step if data is missing -- figure out how to trigger refresh

    this.setState({ activeListType: source });

    console.log("getpagedata", source, this.state);

    if (source === undefined) {
      console.error("unknown page -> source map");
      this.setState({ activeList: [] });
      return [];
    }

    // load the story list from local storage if possible
    const summariesForType = await localforage.getItem<HnStorySummary[]>(
      "STORIES_" + source
    );

    if (summariesForType === null) {
      console.log("no ids to load...");
      this.reloadStoryListFromServer(source);
      return;
    }

    let dataOut = summariesForType;

    if (source !== HnListSource.Front) {
      dataOut = _.sortBy(dataOut, (c) => -c.score);
    }

    this.setState({ activeList: dataOut });
  }

  public async reloadStoryListFromServer(activeList: HnListSource) {
    console.log("loading data");
    let url = "";
    switch (activeList) {
      case HnListSource.Front:
        url = "/topstories/topstories";
        break;
      case HnListSource.Day:
        url = "/topstories/day";
        break;
      case HnListSource.Week:
        url = "/topstories/week";
        break;
      case HnListSource.Month:
        url = "/topstories/month";
        break;
    }

    if (this.state.isLoadingNewData) {
      console.log("only have one request at a time");
      return;
    }

    this.updateIsLoadingStatus(true);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(response);
      this.updateIsLoadingStatus(false);

      return;
    }
    let data: HnItem[] = await response.json();

    if (activeList !== HnListSource.Front) {
      // flip score to get descending
      data = _.sortBy<HnItem>(data, (c) => -c.score);
    }

    // TODO: take that list of items and set it equal to the current list
    // TODO: update the items with a merge of sorts instead of overwriting

    console.log("hn items from server", data);

    this.updateIsLoadingStatus(false);

    this.updateNewItems(data, activeList);
  }

  updateNewItems(data: HnItem[] | undefined, listType: HnListSource): void {
    console.log("items coming from server", data, listType, this.state);

    if (data === undefined) {
      data = [];
    }

    // replace the list with the new IDs
    const storySummaries: HnStorySummary[] = data.map<HnStorySummary>((c) => {
      return {
        id: c.id,
        score: c.score,
        title: c.title,
        url: c.url,
        commentCount: c.descendants,
        time: c.time,
      };
    });

    //  push each item in localforage under its own key

    data.forEach((newStory) => {
      localforage.setItem(newStory.id + "", newStory);
    });

    // also save the new list to localfoeage
    localforage.setItem("STORIES_" + listType, storySummaries);

    // update otherwise

    this.setState({
      activeList: storySummaries,
    });
  }
}
