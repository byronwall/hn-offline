import { Meta, Title } from "@solidjs/meta";
import { createAsync, useParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  untrack,
} from "solid-js";

import { useAppData, useDataStore } from "~/contexts/AppDataContext";
import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getStoryForPage } from "~/server/queries";

import type { HnItem } from "~/models/interfaces";

type StoryData = {
  result: HnItem | null | undefined;
  startedFromServer: boolean;
  // The server did not have the story and did not fetch it (see getStoryForPage).
  uncached?: boolean;
};

export default function Story() {
  const dataStore = useDataStore();

  const params = useParams();
  const id = createMemo(() => +params.id);

  const isClientMounted = useAppData().isClientMounted;

  const data = createAsync<StoryData>(async () => {
    // untrack the isClientMounted signal to avoid re-processing on mount
    const isClient = untrack(() => isClientMounted());

    if (!Number.isInteger(id())) {
      return { result: null, startedFromServer: !isClient };
    }

    if (isClient) {
      return {
        result: await dataStore.getContent(id()),
        startedFromServer: false,
      };
    }

    const page = await getStoryForPage(id());
    return {
      result: page.result.story,
      startedFromServer: page.startedFromServer,
      uncached: page.result.uncached,
    };
  });

  // A story loaded after the page rendered: from this browser's saved copy,
  // or from the "Load story" button. Keyed by id so it resets on navigation.
  const [loaded, setLoaded] = createSignal<{ id: number; story: HnItem }>();
  const [loading, setLoading] = createSignal(false);
  const loadedStory = () =>
    loaded()?.id === id() ? loaded()?.story : undefined;

  const latest = (): StoryData | undefined => {
    const story = loadedStory();
    return story ? { result: story, startedFromServer: false } : data.latest;
  };

  createEffect(
    on(latest, (value) => dataStore.syncStory(id(), value))
  );

  const showLoadButton = () =>
    !loadedStory() && data.latest?.uncached === true;

  // Old stories this browser saved before open without a click.
  createEffect(
    on(
      () => isClientMounted() && showLoadButton(),
      async (check) => {
        if (!check) {
          return;
        }
        const storyId = id();
        const saved = await dataStore.getContent(storyId, {
          allowNetwork: false,
        });
        if (saved) {
          setLoaded({ id: storyId, story: saved });
        }
      }
    )
  );

  const loadStory = async () => {
    const storyId = id();
    setLoading(true);
    try {
      const story = await dataStore.getContent(storyId);
      if (story) {
        setLoaded({ id: storyId, story });
      }
    } finally {
      setLoading(false);
    }
  };

  const story = () => latest()?.result ?? undefined;

  return (
    <>
      <Title>
        {story()?.title ? `${story()?.title} | HN Offline` : "HN Offline"}
      </Title>
      <Meta name="robots" content="noindex, nofollow" />
      <HnStoryPage
        id={id()}
        story={story()}
        startedFromServer={latest()?.startedFromServer ?? false}
        notFound={
          !showLoadButton() &&
          latest() !== undefined &&
          !latest()?.result
        }
        onLoadStory={showLoadButton() ? loadStory : undefined}
        loadingStory={loading()}
      />
    </>
  );
}
