import { createAsync } from "@solidjs/router";
import { createEffect, createMemo, createRenderEffect } from "solid-js";
import { isServer } from "solid-js/web";

import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";
import { addMessage } from "~/stores/messages";
import { isOfflineMode } from "~/stores/serviceWorkerStatus";
import {
  isLoadingData,
  persistStoryList,
  refreshActive,
  setRefreshType,
  storyListStore,
} from "~/stores/useDataStore";
import {
  refreshRequestedTimestamps,
  refreshTimestamps,
  setRefreshRequestedTimestamp,
} from "~/stores/useRefreshStore";

import { HnStoryList } from "./HnStoryList";

import type { StoryPage } from "~/models/interfaces";

export function ServerStoryPage(props: { page: TopStoriesType }) {
  const data = createAsync(() => {
    if (!isServer || isOfflineMode()) {
      return Promise.resolve([] as HnItem[]);
    }
    return getStoryListByType(props.page);
  });

  const summaries = createMemo(() => {
    const page = props.page as StoryPage;
    return storyListStore[page]?.data;
  });

  const lastUpdatedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshTimestamps[page];
  });

  const lastRequestedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshRequestedTimestamps[page];
  });

  createEffect(() => {
    const p = props.page;
    const d = data.latest;
    if (!d || !Array.isArray(d) || isOfflineMode()) {
      return;
    }

    console.log("*** persisting story list", p, d.length);
    void persistStoryList(p as StoryPage, d as HnItem[]);
  });

  createRenderEffect(() => {
    setRefreshType({ type: "storyList", page: props.page as StoryPage });
    addMessage("refresh", "setRefreshType", { page: props.page });
  });

  createRenderEffect(() => {
    const page = props.page as StoryPage;
    if (refreshRequestedTimestamps[page] === undefined) {
      setRefreshRequestedTimestamp(page);
    }
  });

  createEffect(() => {
    if (!summaries()) {
      return;
    }
    addMessage("render", "set summaries", {
      count: summaries()?.length ?? 0,
    });
  });

  createEffect(() => {
    const page = props.page as StoryPage;
    addMessage("refresh", "timestamps", {
      page,
      updated: lastUpdatedTs(),
      requested: lastRequestedTs(),
    });
  });

  return (
    <HnStoryList
      items={summaries()}
      sortType={props.page === "topstories" ? undefined : "score"}
      isLoading={isLoadingData()}
      isOffline={isOfflineMode()}
      lastUpdatedTs={lastUpdatedTs()}
      lastRequestedTs={lastRequestedTs()}
      onRefresh={refreshActive}
    />
  );
}
