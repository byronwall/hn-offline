import { createEffect, createRenderEffect, createResource } from "solid-js";
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
} from "~/stores/useDataStore";

import { HnStoryList, setActiveStoryList } from "./HnStoryList";

import type { StoryPage } from "~/models/interfaces";

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

  createEffect(() => {
    const d = data.latest;

    const p = props.page;
    if (d?.source === "server" && d?.data.type === "fullData") {
      console.log("*** persisting story list for server data", p, d);
      void persistStoryList(p as StoryPage, d?.data.data as HnItem[]);
    }
  });

  createRenderEffect(() => {
    setRefreshType({ type: "storyList", page: props.page as StoryPage });
    addMessage("refresh", "setRefreshType", { page: props.page });
  });

  createRenderEffect(() => {
    if (data.state !== "ready") {
      // only pass along the summaries if the data is ready
      return;
    }

    const summaries =
      data.latest?.data.type === "summaryOnly"
        ? data.latest?.data.data
        : mapStoriesToSummaries(data.latest?.data.data ?? []);

    if (summaries === undefined) {
      return;
    }

    setActiveStoryList(summaries);
    addMessage("render", "set summaries", {
      count: summaries.length,
    });
  });

  return (
    <HnStoryList
      page={props.page as StoryPage}
      sortType={props.page === "topstories" ? undefined : "score"}
    />
  );
}
