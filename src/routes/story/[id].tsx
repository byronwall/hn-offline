import { Meta, Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createRenderEffect,
  createResource,
  Show,
} from "solid-js";
import { isServer } from "solid-js/web";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { ResourceSource } from "~/lib/universalDataFetcher";
import { getDomain } from "~/lib/utils";
import { HnItem } from "~/models/interfaces";
import { getFullDataForIds } from "~/server/getFullDataForIds";
import { setActiveStoryData } from "~/stores/activeStorySignal";
import { setColorMap } from "~/stores/colorMap";
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

  const [data] = createResource(id, async (idParam) => {
    // this thing evaluates when the data is requested...
    console.log("*** createUniversalResource", idParam);
    console.log("*** isServer", isServer);

    if (isServer) {
      const storyData = await getFullDataForIds([idParam]);
      if (storyData.length > 0 && storyData[0]) {
        return {
          source: "server" as ResourceSource,
          data: storyData[0] as HnItem & { kids?: number[] },
        };
      }
      throw new Error("Story not found");
    } else {
      return {
        source: "client" as ResourceSource,
        data: await getContent(idParam),
      };
    }
  });

  createEffect(() => {
    if (data()?.source === "server") {
      void persistStoryToStorage(id(), data()?.data as HnItem);
    }
  });

  createRenderEffect(() => {
    if (!data()) {
      return;
    }

    setActiveStoryData(data()?.data as HnItem);
    setRefreshType({ type: "story", id: id() });
  });

  createRenderEffect(() => {
    const storyData = data()?.data as HnItem;

    if (!storyData) {
      return;
    }

    const colors = getColorsForStory(storyData);
    setColorMap(colors);
  });

  return (
    <Show when={data()} fallback={<div>Loading...</div>}>
      {(data) => {
        const storyData = data().data as HnItem | undefined;
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
  );
}
