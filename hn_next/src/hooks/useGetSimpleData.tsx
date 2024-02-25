"use client";
import { useEffect, useState } from "react";

export function useGetSimpleData<T>(getter: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const newData = await getter();
      setData(newData);
      setIsLoading(false);
    }

    fetchData();
  }, [getter, setData]);

  return { data, isLoading };
}
