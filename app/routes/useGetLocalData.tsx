import { useEffect, useState } from "react";

import { HnStorySummary, useDataStore } from "~/stores/useDataStore";

export function useGetLocalData() {
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
