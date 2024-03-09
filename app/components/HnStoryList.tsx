import { HnStorySummary } from "@/stores/useDataStore";
import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items: HnStorySummary[];
}

export function HnStoryList({ items }: HnStoryListProps) {
  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_1fr_3fr]">
        {items.map((item) => (
          <HnListItem data={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}

export default HnStoryList;
