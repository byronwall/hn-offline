import { useDataStore } from "@/stores/useDataStore";
import { useAsync } from "./useAsync";

export function useGetNextPrevStoryIds(id: number) {
  // get the current ID from the URL
  // manually tracking the active list since it will update with local storage
  const { getNext, getPrev, activeList } = useDataStore((s) => ({
    getNext: s.getNextStoryId,
    activeList: s.activeStoryList,
    getPrev: s.getPreviousStoryId,
  }));

  // get the story data from the store
  const nextPrevIds = useAsync(async () => {
    if (id === undefined) {
      return undefined;
    }

    const nextId = await getNext(id);
    const prevId = await getPrev(id);
    return { nextId, prevId };
  }, [id, activeList]);

  return nextPrevIds.value;
}
