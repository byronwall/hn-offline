import localforage from "localforage";
import _ from "lodash";
import { Container } from "unstated";

import { HnListSource, TrueHash } from "./App";
import { SESSION_COLLAPSED } from "./HnStoryPage";

interface DataLayerState {
  allItems: HnItem[];
  currentLists: DataList[];

  activeListType: HnListSource | undefined;
  activeStoryId: number | undefined;

  activeList: HnItem[];
  activeStory: HnItem | undefined;

  isLoadingFresh: boolean;
  isLoadingNewData: boolean;
  isLoadingLocalStorage: boolean;
  localStoragePromise: Promise<any> | undefined;

  readItems: TrueHash;
}

export interface DataList {
  key: HnListSource;
  stories: number[]; // will be an array of IDs
}

const LOCAL_ALL_ITEMS = "HN-ALL-ITEMS";
const LOCAL_DATA_LISTS = "HN-DATA-LISTS";
const LOCAL_READ_ITEMS = "STORAGE_READ_ITEMS";
export class DataLayer extends Container<DataLayerState> {
  constructor() {
    super();

    // run through some initial stuff?

    this.initializeFromLocalStorage();
    // load from local storage on creation

    this.state = {
      allItems: [],
      currentLists: [],
      isLoadingFresh: false,
      isLoadingNewData: false,
      activeList: [],
      activeStory: undefined,
      isLoadingLocalStorage: true,
      localStoragePromise: undefined,
      readItems: {},
      activeListType: undefined,
      activeStoryId: undefined,
    };
  }

  async initializeFromLocalStorage() {
    console.log("loading from local storage");
    this.setState({ isLoadingLocalStorage: true });

    const allItemsProm = localforage.getItem<HnItem[]>(LOCAL_ALL_ITEMS);
    const currentListsProm = localforage.getItem<DataList[]>(LOCAL_DATA_LISTS);
    const readItemsProm = localforage.getItem<TrueHash>(LOCAL_READ_ITEMS);

    const localStorageProm = Promise.all([
      allItemsProm,
      currentListsProm,
      readItemsProm,
    ]);

    // add the promise so that others can await them too
    this.setState({ localStoragePromise: localStorageProm });

    const [allItems, currentLists, readItems] = await localStorageProm;

    console.log("loaded from local storage", allItems, currentLists);
    const result = await this.setState({
      allItems: allItems ?? [],
      currentLists: currentLists ?? [],
      isLoadingLocalStorage: false,
      localStoragePromise: undefined,
      readItems: readItems ?? {},
    });

    if (this.state.activeListType !== undefined) {
      this.updateActiveList(this.state.activeListType);
    }

    if (this.state.activeStoryId !== undefined) {
      this.updateActiveStory(this.state.activeStoryId);
    }
  }

  saveIdToReadList(id: number): void {
    const newReadList = _.cloneDeep(this.state.readItems);
    console.log("new read list", newReadList);

    // skip out if already there
    if (newReadList[id]) {
      return;
    }

    newReadList[id] = true;

    localforage.setItem(LOCAL_READ_ITEMS, newReadList);
    this.setState({ readItems: newReadList });
  }

  async getStoryData(id: number) {
    let item = this.state.allItems.find((c) => c.id === id);
    if (item !== undefined) {
      return item;
    }

    // hit the API for the story data
    return await this.getStoryFromServer(id);
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
    const newItems = this.state.allItems.concat(data);
    this.setState({ allItems: newItems });
    return data;
  }
  updateIsLoadingStatus(isLoading: boolean) {
    this.setState({ isLoadingNewData: isLoading });
  }

  async reloadStoryById(id: number) {
    this.clearItemData(id);

    const newStory = await this.getStoryData(id);
    this.setState({ activeStory: newStory });
  }

  clearItemData(id: number) {
    const itemRemoved = this.state.allItems.find((c) => c.id === id);

    const newData = this.state.allItems.filter((c) => c.id !== id);
    console.log("clear item", {
      before: this.state.allItems.length,
      after: newData.length,
    });

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

    this.setState({ allItems: newData });
  }

  async updateActiveList(source: HnListSource) {
    // TODO: add loading step if data is missing -- figure out how to trigger refresh

    this.setState({ activeListType: source });

    console.log("getpagedata", source, this.state);

    if (source === undefined) {
      console.error("unknown page -> source map");
      return [];
    }

    if (this.state.isLoadingLocalStorage) {
      console.log("need to wait for local storage first");
      return [];
    }

    if (this.state.localStoragePromise) {
      console.log("waiting on local storage to load");
      await this.state.localStoragePromise;
      console.log("local storage loaded");
    }

    const idsToLoad = this.state.currentLists.find((c) => c.key === source);

    if (idsToLoad === undefined) {
      console.log("no ids to load...");
      this.reloadStoryListFromServer(source);
      return;
    }

    let dataOut = idsToLoad.stories
      .map((id) => this.state.allItems.find((c) => c.id === id))
      .filter((c) => c !== undefined) as HnItem[];

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
    const newList = data.map((c) => c.id);

    const newDataList = _.cloneDeep(this.state.currentLists);

    let listToUpdate = newDataList.find((c) => c.key === listType);

    if (listToUpdate === undefined) {
      newDataList.push({
        key: listType,
        stories: newList,
      });
    } else {
      listToUpdate.stories = newList;
    }

    // get all items... replace those whose data is newer in this version

    const newAllItems = _.cloneDeep(this.state.allItems);

    const storiesToReturn: HnItem[] = [];

    data.forEach((newStory) => {
      const existingStoryIndex = newAllItems.findIndex(
        (c) => c.id === newStory.id
      );

      // add the story if it is new
      if (existingStoryIndex === -1) {
        newAllItems.push(newStory);
        storiesToReturn.push(newStory);
        return;
      }

      // check the data if already found
      const existingStory = newAllItems[existingStoryIndex];
      if (existingStory.lastUpdated > newStory.lastUpdated) {
        storiesToReturn.push(existingStory);
        return;
      }

      newAllItems[existingStoryIndex] = newStory;
      storiesToReturn.push(newStory);

      // new story is actually newer... replace its data
    });

    // update otherwise

    this.saveNewDataToLocalStorage(newAllItems, newDataList);

    this.setState({
      allItems: newAllItems,
      currentLists: newDataList,
      activeList: data,
    });
  }
  saveNewDataToLocalStorage(newAllItems: HnItem[], newDataList: DataList[]) {
    localforage.setItem(LOCAL_ALL_ITEMS, newAllItems);
    localforage.setItem(LOCAL_DATA_LISTS, newDataList);
  }

  async updateActiveStory(activeStoryId: number | undefined) {
    this.setState({ activeStoryId: activeStoryId });

    if (activeStoryId === undefined) {
      this.setState({ activeStory: undefined });
      return;
    }

    if (this.state.isLoadingLocalStorage) {
      console.log("will update story when local storage is ready");
      return;
    }

    const story = await this.getStoryData(activeStoryId);

    this.setState({ activeStory: story });
  }
}
