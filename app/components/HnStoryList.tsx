import { HnStorySummary, useDataStore } from "@/stores/useDataStore";
import { HnListItem } from "./HnListItem";

interface HnStoryListProps {
  items?: HnStorySummary[];
}

export function HnStoryList({ items }: HnStoryListProps) {
  const shouldHideReadItems = useDataStore((s) => s.shouldHideReadItems);
  const readItems = useDataStore((s) => s.readItems);

  if (!items) {
    return <div>Loading...</div>;
  }

  const itemsToRender = shouldHideReadItems
    ? items.filter((item) => !readItems[item.id])
    : items;

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
