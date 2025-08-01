import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { validateHnItemArrayAsTypeGuard } from "~/lib/typeGuards";
import { createUniversalResource } from "~/lib/universalDataFetcher";
import { TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import { HnItem, StoryPage } from "~/stores/useDataStore";

import { HnStoryList } from "./HnStoryList";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createUniversalResource<HnItem[]>(
    `/api/topstories/${props.page}`,
    () => getTopStories(props.page) as Promise<HnItem[]>,
    {
      validateResponse: validateHnItemArrayAsTypeGuard,
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
