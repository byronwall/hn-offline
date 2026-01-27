import { createAsync, useParams } from "@solidjs/router";
import { createEffect, createMemo, untrack } from "solid-js";
import { isServer } from "solid-js/web";

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

    console.log("*** getStoryById query", {
      isServer,
      isClient,
    });

    if (isClient) {
      console.log("*** getStoryById client mounted bypass");
      return {
        result: await dataStore.getContent(id()),
        startedFromServer: false,
      };
    }

    return getStoryById(id());
  });

  const story = () => data.latest?.result ?? undefined;

  createEffect(() => {
    console.log("*** getStoryById result", {
      data: data.latest,
      isClientMounted: isClientMounted(),
    });

    updateStoryDataStores(id(), data);
  });

  return (
    <HnStoryPage
      id={id()}
      story={story()}
      startedFromServer={data.latest?.startedFromServer ?? false}
    />
  );
}
