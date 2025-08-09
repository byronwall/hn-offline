import { onMount } from "solid-js";
import { isServer } from "solid-js/web";

import { convertPathToStoryPage } from "~/lib/convertPathToStoryPage";
import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { createUniversalResource } from "~/lib/universalDataFetcher";
import { validateHnStorySummaryArray } from "~/lib/validation";
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import {
  ContentForPage,
  getContentForPage,
  saveStoryListViaReactive,
  StoryPage,
} from "~/stores/useDataStore";

import { HnStoryList } from "./HnStoryList";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createUniversalResource<ContentForPage>(
    () => getContentForPage(props.page),
    async () => ({
      type: "fullData",
      data: (await getTopStories(props.page)) as HnItem[],
    }),
    {
      // validateResponse: validateHnStorySummaryArray,
      onError: (error) =>
        console.error("Failed to fetch stories:", error.message),
    }
  );

  onMount(() => {
    console.log("*** ServerStoryPage mounted", data()?.source);

    if (isServer) {
      console.log("ServerStoryPage mounted, but not on client");
      return;
    }

    const storyData = data()?.data;

    if (!storyData) {
      console.error("No data found for page", props.page);
      return;
    }

    if (storyData.type === "summaryOnly") {
      console.log("*** skipping save, data is summary only");
      return;
    }

    // we now know that we only have HnItem[] instead of HnStorySummary[]
    console.log("*** saving story data to localforage from client mount");
    const storyPage = convertPathToStoryPage(props.page);
    saveStoryListViaReactive(storyPage, storyData.data);
  });

  const summaries = () =>
    data()?.data.type === "summaryOnly"
      ? data()?.data.data
      : mapStoriesToSummaries(data()?.data.data ?? []);

  return (
    <HnStoryList
      items={summaries()}
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
