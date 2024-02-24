"use client";

import { usePathname } from "next/navigation";
import { HnItem, useDataStore } from "../stores/useDataStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HnStoryList } from "@/components/HnStoryList";
import { useGetPageData } from "./useGetPageData";

export default function Home() {
  // get slug from url using next nav
  const pathname = usePathname();

  const initLocal = useDataStore((s) => s.initializeFromLocalForage);

  const { data, isLoading } = useGetPageData(pathname);

  useEffect(() => {
    initLocal();
  }, [initLocal]);

  return (
    <div>
      Testing : {pathname}
      <div>
        {isLoading && <p>Loading...</p>}
        {data && <HnStoryList items={data} readIds={[]} />}
      </div>
    </div>
  );
}

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
