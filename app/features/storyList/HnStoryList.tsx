import { useEffect } from "react";

import { useSortFunction } from "~/hooks/useSortFunction";
import { HnStorySummary, StoryPage, useDataStore } from "~/stores/useDataStore";

import { HnListItem } from "./HnListItem";

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

  if (itemsToRender.length === 0) {
    return (
      <div className="text-center text-gray-500 text-lg">
        No items to show. Most likely, you are filtering to hide read items.
        Click the toggle above to change the setting.
      </div>
    );
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
