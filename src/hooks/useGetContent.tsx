import { useEffect, useState } from "react";

import { getColorsForStory } from "~/lib/getColorsForStory";
import { HnItem, useDataStore } from "~/stores/useDataStore";

export function useGetContent(id: number, initialSsrData: HnItem | undefined) {
  const [storyData, setStoryData] = useState<HnItem | undefined>(
    initialSsrData
  );

  const saveContent = useDataStore((s) => s.saveContent);
  const getContent = useDataStore((s) => s.getContent);
  const dataNonce = useDataStore((s) => s.dataNonce);
  const setColorMap = useDataStore((s) => s.setColorMap);
  const setActiveStoryData = useDataStore((s) => s.setActiveStoryData);

  useEffect(() => {
    async function fetchData() {
      if (initialSsrData !== undefined && dataNonce === 0) {
        console.log("saving ssr content", id, dataNonce);
        await saveContent(id, initialSsrData);
      }

      console.log("useGetContent", id, dataNonce);
      const data = await getContent(id, true);
      if (data) {
        setStoryData(data);
        setActiveStoryData(data);

        const colors = getColorsForStory(data);
        setColorMap(colors);
      }
    }

    fetchData();
  }, [id, dataNonce, getContent]);

  return storyData;
}
