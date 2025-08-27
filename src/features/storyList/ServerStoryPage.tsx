import {
  createEffect,
  createMemo,
  createRenderEffect,
  createResource,
} from "solid-js";
import { isServer } from "solid-js/web";

import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getTopStories } from "~/server/getTopStories";
import { addMessage } from "~/stores/messages";
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

  const summaries = createMemo(() =>
    data()?.data.type === "summaryOnly"
      ? data()?.data.data
      : mapStoriesToSummaries(data()?.data.data ?? [])
  );

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
    setRefreshType({ type: "storyList", page: props.page as StoryPage });
    addMessage("refresh", "setRefreshType", { page: props.page });
  });

  createRenderEffect(() => {
    setActiveStoryList(summaries() ?? []);
    addMessage("render", "set summaries");
  });

  return (
    <HnStoryList
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
