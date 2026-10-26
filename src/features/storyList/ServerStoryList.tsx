import {
  createEffect,
  createMemo,
  createResource,
  on,
  untrack,
} from "solid-js";

import { useAppData, useDataStore } from "~/contexts/AppDataContext";
import { TopStoriesType } from "~/models/interfaces";
import { getStorySummariesByType } from "~/server/queries";

import { HnStoryListBody } from "./HnStoryListBody";

import type { StoryPage } from "~/models/interfaces";

export function ServerStoryList(props: { page: TopStoriesType }) {
  const isClientMounted = useAppData().isClientMounted;
  const dataStore = useDataStore();

  const [data] = createResource(async () => {
    const isClient = untrack(() => isClientMounted());

    if (isClient) {
      const list = await dataStore.getContentForPage(props.page);

      return { result: list, startedFromServer: false };
    }

    return await getStorySummariesByType(props.page);
  });

  // on() keeps store reads inside the sync from re-running this effect.
  createEffect(
    on(
      () => data.latest,
      (latest) => dataStore.syncStoryList(props.page as StoryPage, latest)
    )
  );

  const listItems = createMemo(() => {
    const persisted = dataStore.storyListStore[props.page as StoryPage];
    if (persisted?.data && persisted.data.length > 0) {
      return persisted.data;
    }

    return data()?.result?.data ?? [];
  });

  return (
    <HnStoryListBody
      items={listItems()}
      page={props.page}
      loading={data.loading}
    />
  );
}
