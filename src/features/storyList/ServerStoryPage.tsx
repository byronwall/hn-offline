import { createRenderEffect } from "solid-js";

import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { createUniversalResource } from "~/lib/universalDataFetcher";
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import {
  ContentForPage,
  getContentForPage,
  setRefreshType,
  StoryPage,
} from "~/stores/useDataStore";

import { HnStoryList, setActiveStoryList } from "./HnStoryList";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createUniversalResource<ContentForPage>({
    clientCallback: () => getContentForPage(props.page),
    serverCallback: async () => ({
      type: "fullData",
      data: (await getTopStories(props.page)) as HnItem[],
    }),
  });

  const summaries = () =>
    data()?.data.type === "summaryOnly"
      ? data()?.data.data
      : mapStoriesToSummaries(data()?.data.data ?? []);

  createRenderEffect(() => {
    // TODO: continue this thread to set from the refresh method, repeat for story data
    setActiveStoryList(summaries() ?? []);
    setRefreshType({ type: "storyList", page: props.page as StoryPage });
  });

  return (
    <HnStoryList
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
