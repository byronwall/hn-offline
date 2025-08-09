import { HnStorySummary } from "~/stores/useDataStore";
import { readItems } from "~/stores/useReadItemsStore";

// NOTE: these depend on readItems but do not modify the DOM, so don't need to worry about rendering

export function useSortFunction(
  items: HnStorySummary[] | undefined,
  sortType: string | undefined
) {
  if (!items) {
    return items;
  }

  if (!sortType) {
    return items;
  }

  if (sortType === "score") {
    return toSortedShim(items, (a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  if (sortType === "read-then-points") {
    return toSortedShim(items, (a, b) => {
      const aIsRead = readItems[a.id] !== undefined;
      const bIsRead = readItems[b.id] !== undefined;

      if (aIsRead && bIsRead) {
        const aTimestamp = readItems[a.id]!;
        const bTimestamp = readItems[b.id]!;
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

  return items;
}

function toSortedShim<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  return arr.slice().sort(compareFn);
}
