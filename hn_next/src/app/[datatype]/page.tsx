"use client";

import { usePathname } from "next/navigation";
import { HnItem, useDataStore } from "../../stores/useDataStore";
import { useEffect } from "react";
import Link from "next/link";
import { HnStoryList } from "@/components/HnStoryList";
import { useGetPageData } from "../../hooks/useGetPageData";

export default function StoryListPage() {
  // get slug from url using next nav
  const pathname = usePathname();

  const initLocal = useDataStore((s) => s.initializeFromLocalForage);

  const { data, isLoading } = useGetPageData(pathname);

  useEffect(() => {
    initLocal();
  }, [initLocal]);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {data && <HnStoryList items={data} readIds={[]} />}
    </div>
  );
}
