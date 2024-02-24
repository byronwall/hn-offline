import React from "react";

import { MessageSquareQuote, ChevronUp } from "lucide-react";

import { getDomain } from "@/utils";
import { timeSince } from "@/utils";
import { HnStorySummary } from "@/stores/useDataStore";
import Link from "next/link";
import { cn } from "@/utils";

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
        <Link href={"/story/" + story.id} className="flex">
          <MessageSquareQuote />
          {commentCountNum}
        </Link>
      </React.Fragment>
    );

    const storyLinkEl =
      story.url === undefined ? (
        <Link href={"/story/" + story.id}>{story.title}</Link>
      ) : (
        <a href={story.url} target="_blank" rel="noreferrer">
          {story.title}
        </a>
      );

    return (
      <div className={cn({ isRead: isRead })}>
        <p>{storyLinkEl}</p>
        <p className="flex gap-1">
          <span className="flex">
            <ChevronUp />
            {" " + story.score}
          </span>
          {commentCountNum !== "" && commentCountComp}
          <span>{" | " + timeSince(story.time) + " ago"}</span>
          <span>{" | " + getDomain(story.url)}</span>
        </p>
      </div>
    );
  }
}
