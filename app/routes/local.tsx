import { useEffect, useState } from "react";
import { HnStoryList } from "~/components/HnStoryList";
import { HnStorySummary, useDataStore } from "~/stores/useDataStore";

export default function LocalPage() {
  const dataToUse = useGetLocalData();

  // build story page from stories on device
  if (!dataToUse) return <div>Loading from local storage...</div>;

  return <HnStoryList items={dataToUse} />;
}

function useGetLocalData() {
  const isInit = useDataStore((s) => s.isLocalForageInitialized);
  const getData = useDataStore((s) => s.getAllLocalContent);

  const [dataToUse, setDataToUse] = useState<HnStorySummary[] | undefined>(
    undefined
  );

  useEffect(() => {
    async function fetchData() {
      if (isInit && dataToUse === undefined) {
        const data = await getData();
        if (data) {
          setDataToUse(data);
        }
      }
    }
    fetchData();
  }, [dataToUse, getData, isInit]);

  return dataToUse;
}
