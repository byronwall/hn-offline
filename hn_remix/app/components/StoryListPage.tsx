import { HnItem, useDataStore } from "../stores/useDataStore";
import { useEffect } from "react";
import { HnStoryList } from "@/components/HnStoryList";
import { useGetPageData } from "../hooks/useGetPageData";
import { useLocation } from "@remix-run/react";

export function StoryListPage(props: { data: HnItem[] | undefined }) {
  // get slug from url using next nav
  const pathname = useLocation().pathname;

  const initLocal = useDataStore((s) => s.initializeFromLocalForage);
  const readIds = useDataStore((s) => s.readItems);

  const { data } = useGetPageData(pathname, props.data);

  useEffect(() => {
    initLocal();
  }, [initLocal]);

  return <div>{data && <HnStoryList items={data} readIds={readIds} />}</div>;
}
