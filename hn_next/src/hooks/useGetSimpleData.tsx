"use client";
import { useEffect, useState } from "react";

export function useGetSimpleData<T>(
  getter: () => Promise<T>,
  ssrData: T | undefined = undefined
) {
  const [data, setData] = useState<T | undefined>(ssrData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const newData = await getter();
      setData(newData);
      setIsLoading(false);
    }

    if (ssrData) {
      // if we have ssr data, use it and don't fetch
      return;
    }

    fetchData();
  }, [getter, setData, ssrData]);

  return { data, isLoading };
}
