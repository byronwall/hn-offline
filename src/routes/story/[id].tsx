import { createAsync, useParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  onMount,
  Suspense,
  Switch,
} from "solid-js";
import { isServer } from "solid-js/web";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { HnItem } from "~/models/interfaces";
import { getStoryById } from "~/server/queries";
import { setActiveStoryData } from "~/stores/activeStorySignal";
import { isOfflineMode } from "~/stores/serviceWorkerStatus";
import {
  getContent,
  persistStoryToStorage,
  setRefreshType,
} from "~/stores/useDataStore";

export default function Story() {
  const hideRoute = false;
  const params = useParams();
  const id = createMemo(() => +params.id);
  const [hydrated, setHydrated] = createSignal(false);

  onMount(() => {
    // Let hydration complete before switching to the interactive view.
    setTimeout(() => setHydrated(true), 0);
  });
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
    if (!isOfflineMode()) {
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
      const cached = await getContent(idParam, { allowNetwork: false });
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
    void persistStoryToStorage(id(), story as HnItem);
  });

  createEffect(() => {
    const story = storyValue();
    if (!story) {
      return;
    }

    setActiveStoryData(story as HnItem);
    setRefreshType({ type: "story", id: id() });
  });

  if (hideRoute) {
    return <div class="relative pb-[70vh]" />;
  }

  return (
    <Suspense fallback={<div class="relative pb-[70vh]" />}>
      <Switch>
        <Match when={!storyValue()}>
          <div class="relative pb-[70vh]" />
        </Match>
        <Match when={storyValue()}>
          <HnStoryPage
            id={id()}
            story={storyValue()}
            interactive={hydrated()}
          />
        </Match>
      </Switch>
    </Suspense>
  );
}
