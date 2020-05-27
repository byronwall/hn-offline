import React from "react";
import { Link } from "react-router-dom";

import { getDomain } from "./getDomain";
import { timeSince } from "./timeSince";
import { Glyphicon } from "react-bootstrap";
import classNames from "classnames";

export interface HnStoryProps {
  data: HnItem;

  isRead: boolean | undefined;
}

export class HnListItem extends React.Component<HnStoryProps> {
  render() {
    const story = this.props.data;

    const commentCount = (
      <React.Fragment>
        {" | "}
        <Link to={"/story/" + story.id}>
          <Glyphicon glyph="comment" /> {story.descendants}
        </Link>
      </React.Fragment>
    );

    const storyLinkEl =
      story.url === undefined ? (
        <Link to={"/story/" + story.id}>{story.title}</Link>
      ) : (
        <a href={story.url} target="_blank">
          {story.title}
        </a>
      );

    return (
      <div className={classNames({ isRead: this.props.isRead })}>
        <p>{storyLinkEl}</p>
        <p>
          <span>
            <Glyphicon glyph="chevron-up" /> {" " + story.score}
          </span>
          {story.descendants !== undefined && commentCount}
          <span>{" | " + timeSince(story.time) + " ago"}</span>
          <span>{" | " + getDomain(story.url)}</span>
        </p>
      </div>
    );
  }
}
