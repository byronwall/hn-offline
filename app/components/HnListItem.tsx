import { MessageSquareQuote, ChevronUp } from "lucide-react";

import { getDomain, timeSince, cn } from "@/utils";
import { HnStorySummary, useDataStore } from "@/stores/useDataStore";

import { Link } from "@remix-run/react";

export interface HnStoryProps {
  data: HnStorySummary;
}

export function HnListItem({ data: story }: HnStoryProps) {
  const readIds = useDataStore((s) => s.readItems);
  const isRead = readIds[story.id] !== undefined;

  const commentCountNum =
    story.commentCount ?? ((story as any).kids ?? []).length ?? "";

  const storyLinkEl =
    story.url === undefined ? (
      <Link to={"/story/" + story.id}>{story.title}</Link>
    ) : (
      <a href={story.url} target="_blank" rel="noreferrer">
        {story.title}
      </a>
    );

  return (
    <div
      className={cn(
        "grid grid-cols-subgrid col-span-4",

        { "opacity-20": isRead }
      )}
    >
      <p className="col-span-4 mt-1.5 font-medium mb-1 hover:underline">
        {storyLinkEl}
      </p>

      <span className="flex gap-1 text-gray-700 ">
        <ChevronUp className="stroke-gray-500" />
        {story.score}
      </span>
      {commentCountNum !== "" && (
        <Link
          to={"/story/" + story.id}
          className="flex gap-1 text-gray-700 hover:underline"
        >
          <MessageSquareQuote className="stroke-gray-500" />
          {commentCountNum}
        </Link>
      )}
      <span className="text-gray-600 text-right mr-2">
        {timeSince(story.time)}
      </span>
      <span className="truncate text-gray-400">{getDomain(story.url)}</span>
    </div>
  );
}
