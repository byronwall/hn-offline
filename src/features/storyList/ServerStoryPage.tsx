import { createAsync } from "@solidjs/router";
import { createEffect, createMemo, createRenderEffect } from "solid-js";
import { isServer } from "solid-js/web";

import {
  useDataStore,
  useMessagesStore,
  useRefreshStore,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import { HnStoryList } from "./HnStoryList";

import type { StoryPage } from "~/models/interfaces";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  console.log("*** ServerStoryPage", { isServer, page: props.page });
  const dataStore = useDataStore();
  const refreshStore = useRefreshStore();
  const messagesStore = useMessagesStore();
  const serviceWorker = useServiceWorkerStore();

  const data = createAsync(async (currentValue) => {
    if (!isServer) {
      if (currentValue && Array.isArray(currentValue)) {
        return currentValue as HnItem[];
      }
      if (serviceWorker.isOfflineMode()) {
        return [] as HnItem[];
      }
    }
    return getStoryListByType(props.page);
  });

  const summaries = createMemo(() => {
    const fromServer = data.latest;
    if (fromServer && Array.isArray(fromServer) && fromServer.length > 0) {
      return mapStoriesToSummaries(fromServer);
    }
    const page = props.page as StoryPage;
    return dataStore.storyListStore[page]?.data;
  });

  const lastUpdatedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshStore.refreshTimestamps[page];
  });

  const lastRequestedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshStore.refreshRequestedTimestamps[page];
  });

  createEffect(() => {
    const p = props.page;
    const d = data.latest;
    if (!d || !Array.isArray(d) || serviceWorker.isOfflineMode()) {
      return;
    }

    console.log("*** persisting story list", p, d.length);
    void dataStore.persistStoryList(p as StoryPage, d as HnItem[]);
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

  createEffect(() => {
    if (!summaries()) {
      return;
    }
    messagesStore.addMessage("render", "set summaries", {
      count: summaries()?.length ?? 0,
    });
  });

  createEffect(() => {
    const page = props.page as StoryPage;
    messagesStore.addMessage("refresh", "timestamps", {
      page,
      updated: lastUpdatedTs(),
      requested: lastRequestedTs(),
    });
  });

  return (
    <HnStoryList
      items={summaries()}
      sortType={props.page === "topstories" ? undefined : "score"}
      isLoading={dataStore.isLoadingData()}
      isOffline={serviceWorker.isOfflineMode()}
      lastUpdatedTs={lastUpdatedTs()}
      lastRequestedTs={lastRequestedTs()}
      onRefresh={dataStore.refreshActive}
    />
  );
}
