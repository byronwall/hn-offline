import { Button, H2, H4 } from "@blueprintjs/core";
import { History } from "history";
import _ from "lodash";
import React from "react";

import { GLOBAL_DATA_LAYER } from ".";
import { getDomain } from "./getDomain";
import { isValidComment } from "./HnComment";
import { HnCommentList } from "./HnCommentList";
import { timeSince } from "./timeSince";

import dummyItem from "./dummyItem.json";

interface HnStoryPageState {
  collapsedComments: number[];
  idToScrollTo: number | undefined;

  data: HnItem | undefined | null;
}

export interface HnStoryPageProps {
  id: number | undefined;
  history: History;

  onVisitMarker(id: number): void;
}

export const SESSION_COLLAPSED = "SESSION_COLLAPSED";
export class HnStoryPage extends React.PureComponent<
  HnStoryPageProps,
  HnStoryPageState
> {
  constructor(props: HnStoryPageProps) {
    super(props);

    this.state = {
      collapsedComments: [],
      idToScrollTo: undefined,
      data: undefined,
    };

    this.anchorClickHandler = this.anchorClickHandler.bind(this);
  }

  render() {
    const { data, idToScrollTo, collapsedComments } = this.state;
    const isSkeleton = data === undefined;
    const storyData = data ?? (dummyItem as HnItem);

    // add this line to remove the state info on scrolling -- prevent scroll on reload
    if (idToScrollTo) {
      this.setState({ idToScrollTo: undefined });
    }

    const storyLinkEl =
      storyData.url === undefined ? (
        <span>{storyData.title}</span>
      ) : (
        <a href={storyData.url}>{storyData.title}</a>
      );

    const comments = (storyData.kidsObj || []).filter(isValidComment);

    document.title = `HN: ${storyData.title}`;

    const classMod = {
      className: isSkeleton ? "bp3-skeleton" : undefined,
    };

    return (
      <div>
        <H2 style={{ overflowWrap: "break-word" }} {...classMod}>
          {storyLinkEl}
        </H2>
        <H4>
          <span {...classMod}>{storyData.by}</span>
          <span>{" | "}</span>
          <span {...classMod}>
            {storyData.score}
            {" points"}
          </span>
          <span>{" | "}</span>
          <span {...classMod}>{timeSince(storyData.time)} ago</span>
          <span>{" | "}</span>
          <span {...classMod}>{getDomain(storyData.url)}</span>

          {navigator.share && (
            <>
              <span>{" | "}</span>
              <Button icon="share" onClick={this.handleShareClick} minimal />
            </>
          )}
        </H4>
        {storyData.text !== undefined && (
          <p
            className="top-text"
            dangerouslySetInnerHTML={{ __html: storyData.text }}
          />
        )}

        <HnCommentList
          childComments={comments}
          depth={0}
          collapsedIds={collapsedComments}
          onUpdateOpen={this.handleCollapseEvent}
          idToScrollTo={idToScrollTo}
          isSkeleton={isSkeleton}
        />
      </div>
    );
  }

  private handleShareClick = () => {
    navigator.share({ url: window.location.href });
  };

  private handleCollapseEvent = (
    id: number,
    newOpen: boolean,
    scrollId: number | undefined
  ) => {
    // save the id to session storage
    const { collapsedComments } = this.state;
    if (newOpen) {
      // remove from list
      const newIds = _.cloneDeep(collapsedComments);
      _.remove(newIds, (c) => c === id);

      sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newIds));
      this.setState({ collapsedComments: newIds });
    } else {
      const newIds = collapsedComments.concat(id);

      sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newIds));
      this.setState({ collapsedComments: newIds });
    }

    if (scrollId !== undefined) {
      this.setState({ idToScrollTo: scrollId });
    }
  };

  componentDidMount() {
    const { id, onVisitMarker } = this.props;

    window.scrollTo({ top: 0 });

    // set the data initially -- kick off async request if needed

    document.body.addEventListener("click", this.anchorClickHandler);

    const strCollapsedIds = sessionStorage.getItem(SESSION_COLLAPSED);
    // load the collapsed comments from session storage

    if (strCollapsedIds !== null) {
      const collapsedIds = JSON.parse(strCollapsedIds) as number[];

      this.setState({ collapsedComments: collapsedIds });
    }

    // save the read stories to localForage

    if (id !== undefined) {
      onVisitMarker(id);
    }

    // load the story data

    this.loadStoryData();
  }

  componentDidUpdate(prevProps: HnStoryPageProps) {
    const { id } = this.props;
    const didIdChange = id !== prevProps.id;

    if (didIdChange) {
      this.loadStoryData();
    }
  }

  async loadStoryData() {
    const { id } = this.props;
    // take the ID, get the story, send to state

    // TODO: why is this ever undefined?

    if (id === undefined) {
      return;
    }

    const storyData = await GLOBAL_DATA_LAYER.getStoryData(id);

    this.setState({ data: storyData });
  }

  componentWillUnmount() {
    document.body.removeEventListener("click", this.anchorClickHandler);
  }
  anchorClickHandler(e: any) {
    const { history } = this.props;
    if (e.target.tagName !== "A") {
      return;
    }

    // have a link

    const link = e.target as HTMLAnchorElement;

    const regex = /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;
    const matches = link.href.match(regex);

    if (matches === null) {
      link.target = "_blank";
      return;
    }

    // this will navigate to the new page
    history.push("/story/" + matches[1]);

    e.preventDefault();
    return false;
  }
}
