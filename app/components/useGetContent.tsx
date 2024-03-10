import { useEffect, useState } from "react";
import { HnItem, useDataStore } from "@/stores/useDataStore";

export function useGetContent(id: number, initialSsrData: HnItem | undefined) {
  const [storyData, setStoryData] = useState<HnItem | undefined>(
    initialSsrData
  );

  const saveContent = useDataStore((s) => s.saveContent);
  useEffect(() => {
    if (initialSsrData !== undefined) {
      saveContent(id, initialSsrData);
    }
  }, []);

  const getContent = useDataStore((s) => s.getContent);
  const dataNonce = useDataStore((s) => s.dataNonce);

  useEffect(() => {
    async function fetchData() {
      console.log("useGetContent fetchData", id, dataNonce);
      const data = await getContent(id, true);
      if (data) {
        setStoryData(data);
      }
    }

    fetchData();
  }, [id, dataNonce, getContent]);

  return storyData;
}
