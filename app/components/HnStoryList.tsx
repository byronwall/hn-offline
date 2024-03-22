import { HnStorySummary, StoryPage, useDataStore } from "@/stores/useDataStore";
import { HnListItem } from "./HnListItem";
import { useSortFunction } from "./useSortFunction";
import { useEffect } from "react";

interface HnStoryListProps {
  items?: HnStorySummary[];
  sortType?: "score" | "read-then-points";
  page?: StoryPage;
}

export function HnStoryList({ items, sortType, page }: HnStoryListProps) {
  const itemsToRender = useSortFunction(items, sortType);
  const setActiveStoryList = useDataStore((s) => s.setActiveStoryList);

  useEffect(() => {
    setActiveStoryList(page);
  }, [page, setActiveStoryList]);

  if (!itemsToRender) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_1fr_3fr]">
        {itemsToRender.map((item) => (
          <HnListItem data={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}
