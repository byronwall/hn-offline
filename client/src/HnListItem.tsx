import { Icon } from "@blueprintjs/core";
import classNames from "classnames";
import React from "react";
import { Link } from "react-router-dom";

import { getDomain } from "./getDomain";
import { timeSince } from "./timeSince";
import { HnStorySummary } from "./DataLayer";

export interface HnStoryProps {
  data: HnStorySummary;

  isRead: boolean | undefined;
}

export class HnListItem extends React.PureComponent<HnStoryProps> {
  render() {
    const { data: story, isRead } = this.props;

    const commentCountNum =
      story.commentCount ?? ((story as any).kids ?? []).length ?? "";
    const commentCountComp = (
      <React.Fragment>
        {" | "}
        <Link to={"/story/" + story.id}>
          <Icon icon="comment" /> {commentCountNum}
        </Link>
      </React.Fragment>
    );

    const storyLinkEl =
      story.url === undefined ? (
        <Link to={"/story/" + story.id}>{story.title}</Link>
      ) : (
        <a href={story.url} target="_blank" rel="noreferrer">
          {story.title}
        </a>
      );

    return (
      <div className={classNames({ isRead })}>
        <p>{storyLinkEl}</p>
        <p>
          <span>
            <Icon icon="chevron-up" /> {" " + story.score}
          </span>
          {commentCountNum !== "" && commentCountComp}
          <span>{" | " + timeSince(story.time) + " ago"}</span>
          <span>{" | " + getDomain(story.url)}</span>
        </p>
      </div>
    );
  }
}
