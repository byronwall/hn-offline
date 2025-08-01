import { useParams } from "@solidjs/router";
import { Show } from "solid-js";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { createUniversalResource } from "~/lib/universalDataFetcher";
import { validateHnItemWithComments } from "~/lib/validation";
import { getFullDataForIds } from "~/server/getFullDataForIds";
import { HnItem, useDataStore } from "~/stores/useDataStore";

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

  return (
    <div>
      <Show when={data()} fallback={<div>Loading...</div>}>
        {(data) => <HnStoryPage id={id} storyData={data()} />}
      </Show>
    </div>
  );
}
