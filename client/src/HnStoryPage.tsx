import { H2, H4 } from "@blueprintjs/core";
import { History } from "history";
import _ from "lodash";
import React from "react";

import { GLOBAL_DATA_LAYER } from ".";
import { getDomain } from "./getDomain";
import { isValidComment } from "./HnComment";
import { HnCommentList } from "./HnCommentList";
import { timeSince } from "./timeSince";

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
export class HnStoryPage extends React.Component<
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
    if (!this.state.data) {
      return null;
    }

    // add this line to remove the state info on scrolling -- prevent scroll on reload
    if (this.state.idToScrollTo) {
      this.setState({ idToScrollTo: undefined });
    }

    const storyData = this.state.data;

    const storyLinkEl =
      storyData.url === undefined ? (
        <span>{storyData.title}</span>
      ) : (
        <a href={storyData.url}>{storyData.title}</a>
      );

    const comments = (storyData.kidsObj || []).filter(isValidComment);

    document.title = `HN: ${storyData.title}`;

    return (
      <div>
        <H2 style={{ overflowWrap: "break-word" }}>{storyLinkEl}</H2>
        <H4>
          <span>{storyData.by}</span>
          <span>{" | "}</span>
          <span>
            {storyData.score}
            {" points"}
          </span>
          <span>{" | "}</span>
          <span>{timeSince(storyData.time)} ago</span>
          <span>{" | "}</span>
          <span>{getDomain(storyData.url)}</span>
        </H4>
        {storyData.text !== undefined && (
          <p
            className="top-text"
            dangerouslySetInnerHTML={{ __html: storyData.text }}
          />
        )}

        <HnCommentList
          childComments={comments}
          canExpand={true}
          depth={0}
          collapsedIds={this.state.collapsedComments}
          onUpdateOpen={(id, newOpen, scrollId) =>
            this.handleCollapseEvent(id, newOpen, scrollId)
          }
          idToScrollTo={this.state.idToScrollTo}
        />
      </div>
    );
  }
  handleCollapseEvent(
    id: number,
    newOpen: boolean,
    scrollId: number | undefined
  ): void {
    // save the id to session storage

    if (newOpen) {
      // remove from list
      const newIds = _.cloneDeep(this.state.collapsedComments);
      _.remove(newIds, (c) => c === id);

      sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newIds));
      this.setState({ collapsedComments: newIds });
    } else {
      const newIds = this.state.collapsedComments.concat(id);

      sessionStorage.setItem(SESSION_COLLAPSED, JSON.stringify(newIds));
      this.setState({ collapsedComments: newIds });
    }

    if (scrollId !== undefined) {
      this.setState({ idToScrollTo: scrollId });
    }
  }

  componentDidMount() {
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

    if (this.props.id !== undefined) {
      this.props.onVisitMarker(this.props.id);
    }

    // load the story data

    this.loadStoryData();
  }

  componentDidUpdate(prevProps: HnStoryPageProps) {
    const didIdChange = this.props.id !== prevProps.id;

    if (didIdChange) {
      this.loadStoryData();
    }
  }

  async loadStoryData() {
    // take the ID, get the story, send to state

    // TODO: why is this ever undefined?

    if (this.props.id === undefined) {
      return;
    }

    const storyData = await GLOBAL_DATA_LAYER.getStoryData(this.props.id);

    this.setState({ data: storyData });
  }

  componentWillUnmount() {
    document.body.removeEventListener("click", this.anchorClickHandler);
  }
  anchorClickHandler(e: any) {
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
    this.props.history.push("/story/" + matches[1]);

    e.preventDefault();
    return false;
  }
}
