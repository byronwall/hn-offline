import { HnItem, useDataStore } from "../stores/useDataStore";
import { useCallback, useEffect } from "react";
import { useGetSimpleData } from "./useGetSimpleData";
import { usePrevious } from "react-use";

export function useGetContent(id: number, _ssrData: HnItem | undefined) {
  const getContent = useDataStore((s) => s.getContent);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);
  const saveContent = useDataStore((s) => s.saveContent);
  const dataNonce = useDataStore((s) => s.dataNonce);

  const prevNonce = usePrevious(dataNonce);

  // throw out SSR data if data nonce has changed - client requested new data
  const ssrData = prevNonce === dataNonce ? _ssrData : undefined;

  useEffect(() => {
    if (!ssrData) return;

    saveContent(id, ssrData);
  }, [id, ssrData, saveContent]);

  const getter = useCallback(
    () => getContent(id),
    [getContent, id, isInit, dataNonce]
  );

  return useGetSimpleData(getter, ssrData);
}
