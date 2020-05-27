import { History } from "history";
import React from "react";

import { DataLayer } from "./DataLayer";
import { getDomain } from "./getDomain";
import { isValidComment } from "./HnComment";
import { HnCommentList } from "./HnCommentList";
import { timeSince } from "./timeSince";
import _ from "lodash";

interface HnStoryPageState {
  data: HnItem | undefined;

  collapsedComments: number[];
  idToScrollTo: number | undefined;
}

export interface HnStoryPageProps {
  dataLayer: DataLayer | null;
  id: number;
  history: History;
}

const SESSION_COLLAPSED = "SESSION_COLLAPSED";
export class HnStoryPage extends React.Component<
  HnStoryPageProps,
  HnStoryPageState
> {
  constructor(props: HnStoryPageProps) {
    super(props);

    this.state = {
      data: undefined,
      collapsedComments: [],
      idToScrollTo: undefined,
    };

    this.anchorClickHandler = this.anchorClickHandler.bind(this);
  }

  render() {
    if (this.state.data === undefined) {
      return null;
    }

    console.log("scroll to ID", this.state.idToScrollTo);

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
        <h2 style={{ overflowWrap: "break-word" }}>{storyLinkEl}</h2>
        <h4>
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
        </h4>
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
    window.scrollTo({ top: 0, behavior: "smooth" });

    // set the data initially -- kick off async request if needed
    this.updateDataFromDataLayer();
    document.body.addEventListener("click", this.anchorClickHandler);

    const strCollapsedIds = sessionStorage.getItem(SESSION_COLLAPSED);
    // load the collapsed comments from session storage

    if (strCollapsedIds !== null) {
      const collapsedIds = JSON.parse(strCollapsedIds) as number[];

      this.setState({ collapsedComments: collapsedIds });
    }
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

  private async updateDataFromDataLayer() {
    const storyData = await this.getStoryData(this.props.id);

    this.setState({ data: storyData });
  }

  componentDidUpdate(prevProps: HnStoryPageProps) {
    // load the story once the data layer is available
    if (prevProps.dataLayer === null && this.props.dataLayer !== null) {
      this.updateDataFromDataLayer();
    }
  }

  private async getStoryData(id: number): Promise<HnItem | undefined> {
    return this.props.dataLayer === null
      ? undefined
      : await this.props.dataLayer.getStoryData(id);
  }
}
