import { useDataStore } from "@/stores/useDataStore";
import { useAsync } from "./useAsync";

export function useGetNextPrevStoryIds(id: number) {
  // get the current ID from the URL
  const getNext = useDataStore((s) => s.getNextStoryId);
  const getPrev = useDataStore((s) => s.getPreviousStoryId);

  // get the story data from the store
  const nextPrevIds = useAsync(async () => {
    if (id === undefined) {
      return undefined;
    }

    const nextId = await getNext(id);
    const prevId = await getPrev(id);
    return { nextId, prevId };
  }, [id]);

  return nextPrevIds.value;
}
