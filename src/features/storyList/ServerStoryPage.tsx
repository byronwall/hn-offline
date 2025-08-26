import { createEffect, createRenderEffect, createResource } from "solid-js";
import { isServer } from "solid-js/web";

import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import {
  ContentForPage,
  getContentForPage,
  persistStoryList,
  setRefreshType,
  StoryPage,
} from "~/stores/useDataStore";

import { HnStoryList, setActiveStoryList } from "./HnStoryList";

export type ResourceSource = "client" | "server";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const [data] = createResource(
    () => props.page,
    async (page) => {
      if (isServer) {
        const fullData = (await getTopStories(page)) as HnItem[];
        return {
          source: "server" as ResourceSource,
          data: {
            type: "fullData",
            data: fullData,
          } as ContentForPage,
        };
      } else {
        return {
          source: "client" as ResourceSource,
          data: await getContentForPage(page),
        };
      }
    }
  );

  const summaries = () =>
    data()?.data.type === "summaryOnly"
      ? data()?.data.data
      : mapStoriesToSummaries(data()?.data.data ?? []);

  createEffect(() => {
    if (data()?.source === "server" && data()?.data.type === "fullData") {
      console.log("*** persisting story list for server data", props.page);
      void persistStoryList(
        props.page as StoryPage,
        data()?.data.data as HnItem[]
      );
    }
  });

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
