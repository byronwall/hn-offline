import { createResource } from "solid-js";

import { TopStoriesType } from "~/models/interfaces";
import { HnStorySummary, StoryPage } from "~/stores/useDataStore";

import { HnStoryList } from "./HnStoryList";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createResource(async () => {
    // TODO: need to get the full URL proper
    // TODO: when using client, this should defer to local storage (no fetch)
    const response = await fetch(
      `http://localhost:3000/api/topstories/${props.page}`
    );
    return (await response.json()) as HnStorySummary[];
  });

  return (
    <HnStoryList
      items={data()}
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
