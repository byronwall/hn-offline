import { createResource } from "solid-js";

import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import { HnItem, StoryPage } from "~/stores/useDataStore";

import { HnStoryList } from "./HnStoryList";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createResource(async () => {
    // TODO: need to get the full URL proper
    // TODO: when using client, this should defer to local storage (no fetch)

    if (typeof window === "undefined") {
      // on server, hit directly
      console.log("ServerStoryPage on server, hitting directly");

      // TODO: review this type
      return getTopStories(props.page) as unknown as HnItem[];
    }

    console.log("ServerStoryPage on client, hitting server");
    const response = await fetch(`/api/topstories/${props.page}`);
    return (await response.json()) as HnItem[];
  });

  const summaries = () => mapStoriesToSummaries(data());

  return (
    <HnStoryList
      items={summaries()}
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
