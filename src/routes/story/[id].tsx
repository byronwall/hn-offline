import { createAsync, useParams } from "@solidjs/router";
import { createEffect, createMemo, untrack } from "solid-js";

import {
  updateStoryDataStores,
  useAppData,
  useDataStore,
} from "~/contexts/AppDataContext";
import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getStoryById } from "~/server/queries";

export default function Story() {
  const dataStore = useDataStore();

  const params = useParams();
  const id = createMemo(() => +params.id);

  const isClientMounted = useAppData().isClientMounted;

  const data = createAsync(async () => {
    // untrack the isClientMounted signal to avoid re-processing on mount
    const isClient = untrack(() => isClientMounted());

    if (isClient) {
      return {
        result: await dataStore.getContent(id()),
        startedFromServer: false,
      };
    }

    return getStoryById(id());
  });

  createEffect(() => {
    updateStoryDataStores(id(), data);
  });

  const story = () => data.latest?.result ?? undefined;

  return (
    <HnStoryPage
      id={id()}
      story={story()}
      startedFromServer={data.latest?.startedFromServer ?? false}
    />
  );
}
