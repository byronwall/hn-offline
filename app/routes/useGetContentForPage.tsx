import { useEffect, useMemo, useState } from "react";

import { mapStoriesToSummaries } from "~/lib/getSummaryViaFetch";
import {
  HnItem,
  HnStorySummary,
  StoryPage,
  useDataStore,
} from "~/stores/useDataStore";

export function useGetContentForPage(
  page: string,
  rawStoryData: HnItem[] | undefined
) {
  const mappedRawData = useMemo(() => {
    if (!rawStoryData) return undefined;

    return mapStoriesToSummaries(rawStoryData);
  }, [rawStoryData]);

  const [summaryData, setSummaryData] = useState<HnStorySummary[] | undefined>(
    mappedRawData
  );

  // save the raw list to localforage -- will make summary over there too
  const savePage = useDataStore((s) => s.saveStoryList);

  // get the updated page data - if user hits refresh
  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const dataNonce = useDataStore((s) => s.dataNonce);

  useEffect(() => {
    async function fetchData() {
      if (rawStoryData !== undefined && dataNonce === 0) {
        console.log("saving page", page, rawStoryData.length, dataNonce);
        await savePage(page as StoryPage, rawStoryData);
      }

      console.log("useGetContentForPage fetchData", page, dataNonce);
      const data = await getContentForPage(page, true);
      if (data) {
        setSummaryData(data);
      }
    }

    fetchData();
  }, [page, dataNonce, getContentForPage]);

  return summaryData;
}
