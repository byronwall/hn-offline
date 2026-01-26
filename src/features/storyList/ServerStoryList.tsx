import { createAsync } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createRenderEffect,
  untrack,
} from "solid-js";
import { isServer } from "solid-js/web";

import {
  useAppData,
  useDataStore,
  useMessagesStore,
  useRefreshStore,
} from "~/contexts/AppDataContext";
import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import { HnStoryListBody } from "./HnStoryListBody";
import { HnStoryListToggle } from "./HnStoryListToggle";

import type { StoryPage } from "~/models/interfaces";

export function ServerStoryList(props: { page: TopStoriesType }) {
  console.log("*** ServerStoryPage", { isServer, page: props.page });
  const isClientMounted = useAppData().isClientMounted;
  const dataStore = useDataStore();
  const refreshStore = useRefreshStore();
  const messagesStore = useMessagesStore();

  const data = createAsync(async () => {
    const isClient = untrack(() => isClientMounted());

    console.log("*** getStoryListByType query", {
      isServer,
      isClient,
      page: props.page,
    });

    if (isClient) {
      const list = await dataStore.getContentForPage(props.page);

      return { result: list, startedFromServer: false };
    }

    return getStoryListByType(props.page);
  });

  const summaries = createMemo(() => {
    const fromQuery = data.latest?.result;
    if (fromQuery && fromQuery.type === "fullData") {
      // we need to map the full data to summaries
      return mapStoriesToSummaries(fromQuery.data);
    }
    return fromQuery?.data;
  });

  // TODO: persistence should move out of the render path

  createEffect(() => {
    const p = props.page as StoryPage;
    const latest = data.latest;
    const d = latest?.result;
    if (!latest?.startedFromServer || !d || !Array.isArray(d)) {
      return;
    }

    console.log("*** persisting story list", p, d.length);
    void dataStore.persistStoryList(p, d);
  });

  createRenderEffect(() => {
    dataStore.setRefreshType({
      type: "storyList",
      page: props.page as StoryPage,
    });
    messagesStore.addMessage("refresh", "setRefreshType", { page: props.page });
  });

  createRenderEffect(() => {
    const page = props.page as StoryPage;
    if (refreshStore.refreshRequestedTimestamps[page] === undefined) {
      refreshStore.setRefreshRequestedTimestamp(page);
    }
  });

  return (
    <>
      <HnStoryListBody items={summaries()} page={props.page} />
      <HnStoryListToggle />
    </>
  );
}
