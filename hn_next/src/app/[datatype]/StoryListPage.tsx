"use client";
import { usePathname } from "next/navigation";
import { HnItem, useDataStore } from "../../stores/useDataStore";
import { useEffect } from "react";
import { HnStoryList } from "@/components/HnStoryList";
import { useGetPageData } from "../../hooks/useGetPageData";

export function StoryListPage(props: { data: HnItem[] }) {
  // get slug from url using next nav
  const pathname = usePathname();

  const initLocal = useDataStore((s) => s.initializeFromLocalForage);
  const readIds = useDataStore((s) => s.readItems);

  const { data, isLoading } = useGetPageData(pathname, props.data);

  useEffect(() => {
    initLocal();
  }, [initLocal]);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {data && <HnStoryList items={data} readIds={readIds} />}
    </div>
  );
}
