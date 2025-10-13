import { HnStorySummary } from "~/models/interfaces";

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

  return items;
}

function toSortedShim<T>(arr: T[], compareFn: (a: T, b: T) => number): T[] {
  return arr.slice().sort(compareFn);
}
