import { createAsync } from "@solidjs/router";
import { createEffect, createMemo, untrack } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import {
  updateStoryListDataStores,
  useAppData,
  useDataStore,
} from "~/contexts/AppDataContext";
import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import { TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import { HnStoryListBody } from "./HnStoryListBody";
import { HnStoryListToggle } from "./HnStoryListToggle";

import type { HnStorySummary } from "~/models/interfaces";

export function ServerStoryList(props: { page: TopStoriesType }) {
  const isClientMounted = useAppData().isClientMounted;
  const dataStore = useDataStore();

  const data = createAsync(async () => {
    const isClient = untrack(() => isClientMounted());

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

  const [summaryStore, setSummaryStore] = createStore<HnStorySummary[]>(
    data.latest?.result?.data ?? []
  );

  createEffect(() => {
    const sums = summaries();
    if (sums) {
      // in theory this store should give a nice reorder effect for auto-animate?
      setSummaryStore(reconcile(sums, { key: "id" }));
    }
  });

  createEffect(() => {
    updateStoryListDataStores(props.page, data);
  });

  return (
    <>
      <HnStoryListBody items={summaryStore} page={props.page} />
      <HnStoryListToggle />
    </>
  );
}
