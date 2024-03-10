import { useEffect, useMemo, useState } from "react";
import { HnItem, HnStorySummary, useDataStore } from "~/stores/useDataStore";
import { mapStoriesToSummaries } from "~/stores/getSummaryViaFetch";

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
  useEffect(() => {
    if (rawStoryData !== undefined) {
      savePage(page, rawStoryData);
    }
  }, []);

  // get the updated page data - if user hits refresh
  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const dataNonce = useDataStore((s) => s.dataNonce);

  useEffect(() => {
    async function fetchData() {
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
