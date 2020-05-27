import "./App.css";

import _ from "lodash";
import React, { RefObject } from "react";
import { Route, RouteComponentProps, Switch, withRouter } from "react-router";

import { DataLayer } from "./DataLayer";
import { Header } from "./Header";
import { HnStoryList } from "./HnStoryList";
import { HnStoryPage } from "./HnStoryPage";
import localforage from "localforage";

interface StoryPageProps extends RouteComponentProps<{ id: string }> {}
interface AppPageProps extends RouteComponentProps<{ page?: string }> {}

const STORAGE_READ_ITEMS = "STORAGE_READ_ITEMS";
class _App extends React.Component<AppPageProps, AppState> {
  dataLayer: RefObject<DataLayer>;

  static getDerivedStateFromProps(props: AppPageProps, state: AppState) {
    let listType: HnListSource;
    switch (props.match.params.page) {
      case "day":
        listType = HnListSource.Day;
        break;

      case "week":
        listType = HnListSource.Week;
        break;

      case "month":
        listType = HnListSource.Month;
        break;

      default:
        listType = HnListSource.Front;
        break;
    }

    console.log("derived state", props.match.params.page, listType);

    return { ...state, activeList: listType };
  }

  constructor(props: AppPageProps) {
    super(props);

    this.state = {
      items: [],
      allItems: [],
      activeList: HnListSource.Front,
      error: undefined,
      isLoading: false,
      readIdList: {},
      storyKey: 0,
    };

    this.dataLayer = React.createRef();

    this.updateActiveDataStore = this.updateActiveDataStore.bind(this);
    this.newItemsProvided = this.newItemsProvided.bind(this);
  }

  async componentDidMount() {
    // read the saved read list

    const readItems = await localforage.getItem<TrueHash>(STORAGE_READ_ITEMS);

    if (readItems !== null) {
      this.setState({ readIdList: readItems });
    }
  }

  updateActiveDataStore(items: HnItem[], isActive: boolean) {
    if (isActive) {
      this.setState({ items });
    }

    // this is needed to ensure that state updates are atomic
    // all new items need to be joined together... cannot skip updatesÍ
    this.setState((prevState) => {
      let allItems = _.cloneDeep(prevState.allItems).concat(items);
      allItems = _.uniqBy(allItems, (c) => c.id);
      console.log("new all itemS", allItems);
      return { allItems };
    });
  }

  render() {
    console.log("render state", this.state, this.dataLayer);

    if (this.state.error !== undefined) {
      return (
        <div>
          <p>an error occurred, refresh the page</p>
          <p>
            unfortunately, your local data was cleared to prevent corruption
          </p>
        </div>
      );
    }

    return (
      <div>
        <DataLayer
          ref={this.dataLayer}
          provideNewItems={this.newItemsProvided}
          updateIsLoadingStatus={(isLoading) => this.setState({ isLoading })}
          loadFreshSource={this.state.activeList}
        />

        <Header
          requestNewData={() => {
            const isStoryPage =
              this.props.location.pathname.indexOf("story") > -1;

            if (isStoryPage) {
              // get the story id -- delete that data from local -- force update
              const id = +this.props.location.pathname.split("/")[2];

              console.log("clear old story");
              this.dataLayer.current!.clearItemData(id);
              this.setState((prevState) => {
                return { storyKey: prevState.storyKey + 1 };
              });
              return;
            }

            if (!this.state.isLoading) {
              this.dataLayer.current!.loadData(this.state.activeList);
            }
          }}
          isLoading={this.state.isLoading}
        />

        <Switch>
          <Route
            path={"/story/:id"}
            exact
            render={(props: StoryPageProps) => (
              <HnStoryPage
                id={+props.match.params.id}
                dataLayer={this.dataLayer.current}
                history={props.history}
                key={props.match.params.id + "-" + this.state.storyKey}
                onVisitMarker={(id) => this.saveIdToReadList(id)}
              />
            )}
          />
          <Route
            path="/:page?"
            render={(props: AppPageProps) => (
              <HnStoryList
                items={
                  this.dataLayer.current === null
                    ? []
                    : this.dataLayer.current.getPageData(
                        props.match.params.page
                      )
                }
                readIds={this.state.readIdList}
                {...props}
              />
            )}
          />
        </Switch>
      </div>
    );
  }
  saveIdToReadList(id: number): void {
    const newReadList = _.cloneDeep(this.state.readIdList);
    console.log("new read list", newReadList);

    // skip out if already there
    if (newReadList[id]) {
      return;
    }

    newReadList[id] = true;

    localforage.setItem(STORAGE_READ_ITEMS, newReadList);
    this.setState({ readIdList: newReadList });
  }

  newItemsProvided(items: HnItem[], listType: HnListSource): void {
    if (listType === this.state.activeList) {
      this.setState({ items });
    }
  }
}

export const App = withRouter(_App);

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
  items: HnItem[];
  allItems: HnItem[];

  error: any;

  activeList: HnListSource;

  isLoading: boolean;

  readIdList: TrueHash;

  storyKey: number;
}
