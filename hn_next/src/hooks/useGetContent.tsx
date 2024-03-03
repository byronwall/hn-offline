import { HnItem, useDataStore } from "../stores/useDataStore";
import { useCallback, useEffect } from "react";
import { useGetSimpleData } from "./useGetSimpleData";

export function useGetContent(id: number, ssrData: HnItem | undefined) {
  const getContent = useDataStore((s) => s.getContent);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);
  const saveContent = useDataStore((s) => s.saveContent);

  useEffect(() => {
    if (!ssrData) return;

    saveContent(id, ssrData);
  }, [id, ssrData, saveContent]);

  const getter = useCallback(() => getContent(id), [getContent, id, isInit]);

  return useGetSimpleData(getter, ssrData);
}
