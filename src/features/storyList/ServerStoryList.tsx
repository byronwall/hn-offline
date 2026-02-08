import { createEffect, createMemo, createResource, untrack } from "solid-js";

import {
  updateStoryListDataStores,
  useAppData,
  useDataStore,
} from "~/contexts/AppDataContext";
import { TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import { HnStoryListBody } from "./HnStoryListBody";
import { HnStoryListToggle } from "./HnStoryListToggle";

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

    return await getStoryListByType(props.page);
  });

  createEffect(() => {
    updateStoryListDataStores(props.page, data);
  });

  const listItems = createMemo(() => {
    const persisted = dataStore.storyListStore[props.page as StoryPage];
    if (persisted?.data && persisted.data.length > 0) {
      return persisted.data;
    }

    return data()?.result?.data ?? [];
  });

  return (
    <>
      <HnStoryListBody items={listItems()} page={props.page} />
      <HnStoryListToggle />
    </>
  );
}
