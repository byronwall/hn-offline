import { Meta, Title } from "@solidjs/meta";
import { createAsync, useParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createRenderEffect,
  Show,
  Suspense,
} from "solid-js";
import { isServer } from "solid-js/web";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getDomain } from "~/lib/utils";
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
  const params = useParams();
  const id = createMemo(() => +params.id);

  createEffect(() => {
    console.log("*** Story", id());
  });

  const data = createAsync(async () => {
    const idParam = id();
    console.log("*** createStoryAsync", idParam);
    if (!idParam || Number.isNaN(idParam)) {
      return undefined;
    }
    if (!isServer || isOfflineMode()) {
      return await getContent(idParam, { allowNetwork: false });
    }
    const storyData = await getStoryById(idParam);
    return storyData ?? undefined;
  });

  createEffect(() => {
    const story = data();
    if (!story) {
      return;
    }
    void persistStoryToStorage(id(), story as HnItem);
  });

  createRenderEffect(() => {
    const story = data();
    if (!story) {
      return;
    }

    setActiveStoryData(story as HnItem);
    setRefreshType({ type: "story", id: id() });
  });

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Show when={data()} fallback={<HnStoryPage id={id()} />}>
        {(data) => {
          const storyData = data() as HnItem | undefined;
          return (
            <Show when={storyData} fallback={<HnStoryPage id={id()} />}>
              {(_) => {
                const titlePrefix =
                  storyData!.type === "comment"
                    ? "HN Offline Comment by " + storyData!.by
                    : "HN Offline: " + storyData!.title;
                const description =
                  storyData!.type === "comment"
                    ? `${storyData!.text ?? "Comment"}`
                    : `${storyData!.score} points at ${getDomain(
                        storyData!.url
                      )} by ${storyData!.by} - ${
                        storyData!.descendants
                      } comments`;
                return (
                  <>
                    <Title>{titlePrefix}</Title>
                    <Meta name="description" content={description} />
                    <HnStoryPage id={id()} />
                  </>
                );
              }}
            </Show>
          );
        }}
      </Show>
    </Suspense>
  );
}
