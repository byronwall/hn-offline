import { createEffect, createResource, untrack } from "solid-js";

import {
  updateStoryListDataStores,
  useAppData,
  useDataStore,
} from "~/contexts/AppDataContext";
import { TopStoriesType } from "~/models/interfaces";
import { getStoryListByType } from "~/server/queries";

import { HnStoryListBody } from "./HnStoryListBody";
import { HnStoryListToggle } from "./HnStoryListToggle";

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

  return (
    <>
      <HnStoryListBody items={data()?.result?.data ?? []} page={props.page} />
      <HnStoryListToggle />
    </>
  );
}
