import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { createUniversalResource } from "~/lib/universalDataFetcher";
import { validateHnStorySummaryArray } from "~/lib/validation";
import { TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import { StoryPage, useDataStore } from "~/stores/useDataStore";
import { HnStorySummary } from "~/models/interfaces";

import { HnStoryList } from "./HnStoryList";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createUniversalResource<HnStorySummary[]>(
    () => useDataStore.getState().getContentForPage(props.page),
    () => getTopStories(props.page),
    {
      validateResponse: validateHnStorySummaryArray,
      onError: (error) =>
        console.error("Failed to fetch stories:", error.message),
    }
  );

  const summaries = () => mapStoriesToSummaries(data());

  return (
    <HnStoryList
      items={summaries()}
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
