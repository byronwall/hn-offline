import "./App.css";

import React from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { Subscribe } from "unstated";

import { GLOBAL_DATA_LAYER } from ".";
import { DataLayer } from "./DataLayer";
import { Header } from "./Header";
import { HnStoryList } from "./HnStoryList";
import { HnStoryPage } from "./HnStoryPage";

interface AppPageProps
  extends RouteComponentProps<{ page?: string; storyId?: string }> {}

enum HnPage {
  STORY_LIST,
  STORY,
}

export enum HnListSource {
  Front,
  Day,
  Week,
  Month,
}

export type TrueHash = {
  [key: number]: true;
};

interface AppState {
  activeList: HnListSource;
  activePage: HnPage;
  activeStoryId: number | undefined;

  storyKey: number;

  storageUsed: number;
}

class _App extends React.Component<AppPageProps, AppState> {
  lastOpenTime: number;
  constructor(props: AppPageProps) {
    super(props);

    this.lastOpenTime = Date.now();

    this.state = {
      activeList: HnListSource.Front,
      storyKey: 0,
      activePage: HnPage.STORY_LIST,
      activeStoryId: undefined,
      storageUsed: 0,
    };

    this.onFocus = this.onFocus.bind(this);
  }
  static getDerivedStateFromProps(props: AppPageProps, state: AppState) {
    let listType: HnListSource;
    let hnPage: HnPage;
    let storyId: number | undefined = undefined;

    console.log("props page", props.match.params.page);

    const page =
      props.match.params.storyId === undefined
        ? props.match.params.page
        : "story";

    console.log(props.match, page);
    switch (page) {
      case "day":
        listType = HnListSource.Day;
        hnPage = HnPage.STORY_LIST;
        break;

      case "week":
        listType = HnListSource.Week;
        hnPage = HnPage.STORY_LIST;
        break;

      case "month":
        listType = HnListSource.Month;
        hnPage = HnPage.STORY_LIST;
        break;

      case "story":
        hnPage = HnPage.STORY;
        storyId = +(props.match.params.storyId ?? "");
        listType = state.activeList;
        break;

      default:
        listType = HnListSource.Front;
        hnPage = HnPage.STORY_LIST;
        break;
    }

    console.log("derived state", props.match.params, listType, hnPage, storyId);

    return {
      activeList: listType,
      activePage: hnPage,
      activeStoryId: storyId,
    };
  }

  async componentDidMount() {
    // ensure that list and story are correct on a direct load
    switch (this.state.activePage) {
      case HnPage.STORY:
        GLOBAL_DATA_LAYER.updateActiveStory(this.state.activeStoryId);
        break;

      case HnPage.STORY_LIST:
        GLOBAL_DATA_LAYER.updateActiveList(this.state.activeList);
        break;
    }

    this.lastOpenTime = Date.now();

    window.addEventListener("focus", this.onFocus);

    navigator.storage.estimate().then((data) => {
      const size = (data.usage ?? 0) / 1024 / 1024;
      this.setState({ storageUsed: size });
    });
  }

  componentWilUnmount() {
    window.removeEventListener("focus", this.onFocus);
  }

  onFocus() {
    const curTime = Date.now();
    const timeSinceInit = curTime - this.lastOpenTime;
    console.log("time since init", timeSinceInit, this.lastOpenTime, curTime);

    // if it's been more than 1 minute
    if (timeSinceInit > 20 * 1000) {
      console.log(
        "been too long... force reload from local storage in case data changed on other tabs"
      );
      GLOBAL_DATA_LAYER.initializeFromLocalStorage();
    }

    this.lastOpenTime = curTime;
  }

  async componentDidUpdate(prevProps: AppPageProps, prevState: AppState) {
    const didPageChange = prevState.activeList !== this.state.activeList;
    const didGoFromStoryToList =
      prevState.activePage !== this.state.activePage &&
      this.state.activePage === HnPage.STORY_LIST;

    if (didPageChange || didGoFromStoryToList) {
      // load the correct items from the data layer
      GLOBAL_DATA_LAYER.updateActiveList(this.state.activeList);
    }

    const didStoryIdChange =
      prevState.activeStoryId !== this.state.activeStoryId;

    if (didStoryIdChange) {
      GLOBAL_DATA_LAYER.updateActiveStory(this.state.activeStoryId);
    }
  }

  render() {
    return (
      <Subscribe to={[DataLayer]}>
        {(dataLayer: DataLayer) => (
          <div>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 12,
                fontSize: 8,
                color: "#aaa",
              }}
            >
              {this.state.storageUsed.toFixed(1)}
              {" MB"}
            </div>
            <Header
              requestNewData={() => this.requestFreshDataFromDataLayer()}
              isLoading={dataLayer.state.isLoadingNewData}
            />
            {this.state.activePage === HnPage.STORY && (
              <HnStoryPage
                id={this.state.activeStoryId}
                history={this.props.history}
                key={this.state.activeStoryId + "-" + this.state.storyKey}
                onVisitMarker={(id) => dataLayer.saveIdToReadList(id)}
                data={dataLayer.state.activeStory}
              />
            )}
            {this.state.activePage === HnPage.STORY_LIST && (
              <HnStoryList
                items={dataLayer.state.activeList}
                readIds={dataLayer.state.readItems}
                isLoading={dataLayer.state.isLoadingNewData}
                history={this.props.history}
              />
            )}
          </div>
        )}
      </Subscribe>
    );
  }
  requestFreshDataFromDataLayer(): void {
    switch (this.state.activePage) {
      case HnPage.STORY:
        if (this.state.activeStoryId !== undefined) {
          console.log("reloading active story");
          GLOBAL_DATA_LAYER.reloadStoryById(this.state.activeStoryId);
        }
        break;
      case HnPage.STORY_LIST:
        console.log("reloading active list");
        GLOBAL_DATA_LAYER.reloadStoryListFromServer(this.state.activeList);
        break;
    }
  }
}

export const App = withRouter(_App);
