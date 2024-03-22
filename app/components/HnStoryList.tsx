import { HnStorySummary } from "@/stores/useDataStore";
import { HnListItem } from "./HnListItem";
import { useSortFunction } from "./useSortFunction";

interface HnStoryListProps {
  items?: HnStorySummary[];
  sortType?: "score" | "read-then-points";
}

export function HnStoryList({ items, sortType }: HnStoryListProps) {
  const itemsToRender = useSortFunction(items, sortType);

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
