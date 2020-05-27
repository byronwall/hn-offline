import _ from "lodash";
import React from "react";

import { HnListSource } from "./App";
import { LocalStorageWrapper } from "./LocalStorageWrapper";
import localforage from "localforage";
import { SESSION_COLLAPSED } from "./HnStoryPage";

interface DataLayerState {
  allItems: HnItem[];
  currentLists: DataList[];

  isLoadingFresh: boolean;

  isLoadingNewData: boolean;
}

export interface DataList {
  key: HnListSource;
  stories: number[]; // will be an array of IDs
}

interface DataLayerProps {
  provideNewItems(items: HnItem[], listType: HnListSource): void;
  updateIsLoadingStatus(newStatus: boolean): void;
  loadFreshSource: HnListSource;
}

export class DataLayer extends React.Component<DataLayerProps, DataLayerState> {
  refreshData(activeList: HnListSource): void {}
  constructor(props: DataLayerProps) {
    super(props);

    this.state = {
      allItems: [],
      currentLists: [],
      isLoadingFresh: false,
      isLoadingNewData: false,
    };
  }

  render() {
    // TODO: generalize the comps and events for the data type (don't duplicate)
    return (
      <React.Fragment>
        <LocalStorageWrapper<HnItem[]>
          dataDidUpdate={(allItems) =>
            this.processDataFromLocalStorage(allItems, this.state.currentLists)
          }
          activeItem={this.state.allItems}
          storageName="HN-ALL-ITEMS"
        />

        <LocalStorageWrapper<DataList[]>
          dataDidUpdate={(currentLists) =>
            this.processDataFromLocalStorage(this.state.allItems, currentLists)
          }
          activeItem={this.state.currentLists}
          storageName="HN-DATA-LISTS"
        />
      </React.Fragment>
    );
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

    this.props.updateIsLoadingStatus(true);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(response);
      return undefined;
    }
    const data: HnItem | { error: string } = await response.json();

    if ("error" in data) {
      console.error(data);
      this.props.updateIsLoadingStatus(false);
      return undefined;
    }

    console.log("hn item from server", data);

    this.props.updateIsLoadingStatus(false);

    // ensure new story is saved locally
    const newItems = this.state.allItems.concat(data);
    this.setState({ allItems: newItems });
    return data;
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

  getPageData(page: string | undefined) {
    // TODO: add loading step if data is missing -- figure out how to trigger refresh

    console.log("getpagedata", page, this.state);

    if (page === "" || page === undefined) {
      page = "front";
    }

    const pageToSourceMapping: { [key: string]: HnListSource } = {
      day: HnListSource.Day,
      week: HnListSource.Week,
      month: HnListSource.Month,
      front: HnListSource.Front,
    };

    const source = pageToSourceMapping[page];

    if (source === undefined) {
      console.error("unknown page -> source map");
      return [];
    }

    const idsToLoad = this.state.currentLists.find((c) => c.key === source);

    if (idsToLoad === undefined) {
      // TODO: this needs to fire off an update
      console.log("no ids to load...");
      this.loadData(source);
      return [];
    }

    let dataOut = idsToLoad.stories
      .map((id) => this.state.allItems.find((c) => c.id === id))
      .filter((c) => c !== undefined) as HnItem[];

    if (source !== HnListSource.Front) {
      dataOut = _.sortBy(dataOut, (c) => -c.score);
    }

    return dataOut;
  }

  public async loadData(activeList: HnListSource) {
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

    this.props.updateIsLoadingStatus(true);
    this.setState({ isLoadingNewData: true });
    const response = await fetch(url);
    if (!response.ok) {
      console.error(response);
      this.props.updateIsLoadingStatus(false);
      this.setState({ isLoadingNewData: false });
      return;
    }
    let data: HnItem[] = await response.json();

    if (activeList !== HnListSource.Front) {
      // flip score to get descending
      data = _.sortBy<HnItem>(data, (c) => -c.score);
    }

    // TODO: do not reload data on mount... use a button

    // TODO: take that list of items and set it equal to the current list
    // TODO: update the items with a merge of sorts instead of overwriting

    console.log("hn items from server", data);

    this.props.updateIsLoadingStatus(false);
    this.setState({ isLoadingNewData: false });
    this.updateNewItems(data, activeList);
  }

  processDataFromLocalStorage(
    allItems: HnItem[] | undefined,
    allLists: DataList[] | undefined
  ) {
    // all items come through
    // the lists come through also

    console.log("fresh data from local storage", allItems, allLists);

    // these state updates ensure that the data is available for next pass
    if (allItems !== undefined) {
      this.setState({ allItems });
    }

    if (allLists !== undefined) {
      this.setState({ currentLists: allLists });
    }

    if (allItems === undefined || allLists === undefined) {
      if (!this.state.isLoadingFresh) {
        console.log(
          "local storage is empty, loading fresh data based on active page",
          this.props.loadFreshSource
        );
        this.setState({ isLoadingFresh: true });
        this.loadData(this.props.loadFreshSource);
      }
      return;
    }

    // iterate the lists

    allLists.forEach((list) => {
      const items = list.stories
        .map((id) => allItems.find((c) => c.id === id))
        .filter((c) => c !== undefined) as HnItem[];

      this.props.provideNewItems(items, list.key);
    });

    // send out update commands to each one
  }

  updateNewItems(data: HnItem[] | undefined, listType: HnListSource): void {
    console.log("items coming from server", data, listType);

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

    this.setState({ allItems: newAllItems, currentLists: newDataList }, () => {
      this.props.provideNewItems(storiesToReturn, listType);
    });
  }
}
