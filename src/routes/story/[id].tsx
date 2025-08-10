import { useParams } from "@solidjs/router";
import { createEffect, createRenderEffect, Show } from "solid-js";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { createUniversalResource } from "~/lib/universalDataFetcher";
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
  const id = +params.id;

  const [data] = createUniversalResource<HnItem & { kids?: number[] }>({
    clientCallback: () => getContent(id),
    serverCallback: async () => {
      const storyData = await getFullDataForIds([id]);
      if (storyData.length > 0 && storyData[0]) {
        return storyData[0] as HnItem & { kids?: number[] };
      }
      throw new Error("Story not found");
    },
  });

  createEffect(() => {
    if (data()?.source === "server") {
      void persistStoryToStorage(id, data()?.data as HnItem);
    }
  });

  createRenderEffect(() => {
    if (!data()) {
      return;
    }

    setActiveStoryData(data()?.data as HnItem);
    setRefreshType({ type: "story", id });
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
      <HnStoryPage id={id} />
    </Show>
  );
}
