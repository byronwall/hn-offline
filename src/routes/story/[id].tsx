import { useParams } from "@solidjs/router";
import { createEffect, Show } from "solid-js";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { createUniversalResource } from "~/lib/universalDataFetcher";
import { validateHnItemWithComments } from "~/lib/validation";
import { getFullDataForIds } from "~/server/getFullDataForIds";
import { setColorMap } from "~/stores/colorMap";
import { useDataStore } from "~/stores/useDataStore";
import { HnItem } from "~/models/interfaces";

export default function Story() {
  const params = useParams();
  const id = +params.id;

  const [data] = createUniversalResource<HnItem & { kids?: number[] }>(
    () => useDataStore.getState().getContent(id),
    async () => {
      const storyData = await getFullDataForIds([id]);
      if (storyData.length > 0 && storyData[0]) {
        return storyData[0] as HnItem & { kids?: number[] };
      }
      throw new Error("Story not found");
    },
    {
      validateResponse: validateHnItemWithComments,
      onError: (error) =>
        console.error("Failed to fetch story:", error.message),
    }
  );

  createEffect(() => {
    const storyData = data() as HnItem;
    const colors = getColorsForStory(storyData);
    setColorMap(colors);
  });

  return (
    <div>
      <Show when={data()} fallback={<div>Loading...</div>}>
        {(data) => <HnStoryPage id={id} storyData={data()} />}
      </Show>
    </div>
  );
}
