import { createAsync, useParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Switch,
} from "solid-js";
import { isServer } from "solid-js/web";

import {
  useActiveStoryStore,
  useDataStore,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { HnItem } from "~/models/interfaces";
import { getStoryById } from "~/server/queries";

export default function Story() {
  console.log("*** Story");
  const dataStore = useDataStore();
  const serviceWorker = useServiceWorkerStore();
  const activeStoryStore = useActiveStoryStore();

  const params = useParams();
  const id = createMemo(() => +params.id);

  console.log("[HYDRATE_TRACE] route render", {
    isServer,
    paramsId: params.id,
    id: id(),
  });

  const [offlineStory, setOfflineStory] = createSignal<HnItem | undefined>(
    undefined
  );

  const data = createAsync(() => {
    const idParam = id();
    if (!idParam || Number.isNaN(idParam)) {
      return Promise.resolve(undefined);
    }
    return getStoryById(idParam);
  });

  createEffect(() => {
    if (isServer) {
      return;
    }
    if (!serviceWorker.isOfflineMode()) {
      if (offlineStory()) {
        setOfflineStory(undefined);
      }
      return;
    }
    if (data.latest || offlineStory()) {
      return;
    }
    void (async () => {
      const idParam = id();
      if (!idParam || Number.isNaN(idParam)) {
        return;
      }
      const cached = await dataStore.getContent(idParam, {
        allowNetwork: false,
      });
      if (cached) {
        setOfflineStory(cached as HnItem);
      }
    })();
  });

  const storyValue = () =>
    (data.latest as HnItem | undefined) ??
    (data() as HnItem | undefined) ??
    offlineStory();

  createEffect(() => {
    const story = storyValue();
    if (!story) {
      return;
    }
    void dataStore.persistStoryToStorage(id(), story as HnItem);
  });

  createEffect(() => {
    const story = storyValue();
    if (!story) {
      return;
    }

    activeStoryStore.setActiveStoryData(story as HnItem);
    dataStore.setRefreshType({ type: "story", id: id() });
  });

  return <HnStoryPage id={id()} story={storyValue()} />;
}
