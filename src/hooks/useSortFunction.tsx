import { HnStorySummary } from "~/stores/useDataStore";
import { readItems, shouldHideReadItems } from "~/stores/useReadItemsStore";

export function useSortFunction(
  items: HnStorySummary[] | undefined,
  sortType: string | undefined
) {
  if (!items) {
    return items;
  }

  const itemsToRender = shouldHideReadItems()
    ? items.filter((item) => readItems()[item.id] === undefined)
    : items;

  if (!sortType) {
    return itemsToRender;
  }

  if (sortType === "score") {
    return toSortedShim(
      itemsToRender,
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
  }

  if (sortType === "read-then-points") {
    return toSortedShim(itemsToRender, (a, b) => {
      const aIsRead = readItems()[a.id] !== undefined;
      const bIsRead = readItems()[b.id] !== undefined;

      if (aIsRead && bIsRead) {
        const aTimestamp = readItems()[a.id];
        const bTimestamp = readItems()[b.id];
        return bTimestamp - aTimestamp;
      }

      if (aIsRead && !bIsRead) {
        return -1;
      }

      if (!aIsRead && bIsRead) {
        return 1;
      }

      return (b.score ?? 0) - (a.score ?? 0);
    });
  }

  return itemsToRender;
}

function toSortedShim<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  return arr.slice().sort(compareFn);
}
