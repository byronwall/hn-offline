import { HnStorySummary, useDataStore } from "@/stores/useDataStore";

export function useSortFunction(
  items: HnStorySummary[] | undefined,
  sortType: string | undefined
) {
  const shouldHideReadItems = useDataStore((s) => s.shouldHideReadItems);

  const readItems = useDataStore((s) => s.readItems);

  if (!items) {
    return items;
  }

  const itemsToRender = shouldHideReadItems
    ? items.filter((item) => readItems[item.id] === undefined)
    : items;

  if (!sortType) {
    return itemsToRender;
  }

  if (sortType === "score") {
    // const test = itemsToRender.toSorted();
    return toSortedShim(itemsToRender, (a, b) => b.score - a.score);
  }

  if (sortType === "read-then-points") {
    return toSortedShim(itemsToRender, (a, b) => {
      const aIsRead = readItems[a.id] !== undefined;
      const bIsRead = readItems[b.id] !== undefined;

      if (aIsRead && bIsRead) {
        const aTimestamp = readItems[a.id];
        const bTimestamp = readItems[b.id];
        return bTimestamp - aTimestamp;
      }

      if (aIsRead && !bIsRead) {
        return -1;
      }

      if (!aIsRead && bIsRead) {
        return 1;
      }

      return b.score - a.score;
    });
  }

  return itemsToRender;
}

function toSortedShim<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  return arr.slice().sort(compareFn);
}
