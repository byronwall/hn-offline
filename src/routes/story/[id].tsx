import { createAsync, useParams } from "@solidjs/router";
import { createEffect, createMemo, untrack } from "solid-js";
import { isServer } from "solid-js/web";

import {
  useActiveStoryStore,
  useAppData,
  useDataStore,
} from "~/contexts/AppDataContext";
import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getStoryById } from "~/server/queries";

export default function Story() {
  const dataStore = useDataStore();

  const activeStoryStore = useActiveStoryStore();

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

  // persist the story if from server
  // TODO: move into the store and call with one clean function
  createEffect(() => {
    const s = story();
    if (!(data.latest?.startedFromServer && s)) {
      return;
    }
    void dataStore.persistStoryToStorage(id(), s);
  });

  createEffect(() => {
    console.log("*** getStoryById result", {
      data: data.latest,
      isClientMounted: isClientMounted(),
    });

    if (!story()) {
      return;
    }

    activeStoryStore.setActiveStoryData(story());
    dataStore.setRefreshType({ type: "story", id: id() });
  });

  return (
    <HnStoryPage
      id={id()}
      story={story()}
      startedFromServer={data.latest?.startedFromServer ?? false}
    />
  );
}
