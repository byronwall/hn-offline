import { createAsync } from "@solidjs/router";
import { fromArray } from "happy-dom/lib/PropertySymbol";
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
import { HnItem, TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import { HnStoryList } from "./HnStoryList";

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

  const lastUpdatedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshStore.refreshTimestamps[page];
  });

  const lastRequestedTs = createMemo(() => {
    const page = props.page as StoryPage;
    return refreshStore.refreshRequestedTimestamps[page];
  });

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

  createEffect(() => {
    if (!summaries()) {
      return;
    }
    messagesStore.addMessage("render", "set summaries", {
      count: summaries()?.length ?? 0,
    });
  });

  return (
    <HnStoryList
      items={summaries()}
      sortType={props.page === "topstories" ? undefined : "score"}
      isLoading={dataStore.isLoadingData()}
      lastUpdatedTs={lastUpdatedTs()}
      lastRequestedTs={lastRequestedTs()}
      onRefresh={dataStore.refreshActive}
    />
  );
}
