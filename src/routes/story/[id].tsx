import { Meta, Title } from "@solidjs/meta";
import { createAsync, useParams } from "@solidjs/router";
import { createEffect, createMemo, on, untrack } from "solid-js";

import { useAppData, useDataStore } from "~/contexts/AppDataContext";
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

    if (!Number.isInteger(id())) {
      return { result: null, startedFromServer: !isClient };
    }

    if (isClient) {
      return {
        result: await dataStore.getContent(id()),
        startedFromServer: false,
      };
    }

    return getStoryById(id());
  });

  createEffect(
    on(
      () => data.latest,
      (latest) => dataStore.syncStory(id(), latest)
    )
  );

  const story = () => data.latest?.result ?? undefined;

  return (
    <>
      <Title>
        {story()?.title ? `${story()?.title} | HN Offline` : "HN Offline"}
      </Title>
      <Meta name="robots" content="noindex, nofollow" />
      <HnStoryPage
        id={id()}
        story={story()}
        startedFromServer={data.latest?.startedFromServer ?? false}
        notFound={data.latest !== undefined && !data.latest.result}
      />
    </>
  );
}
