"use client";
import { HnItem, useDataStore } from "../stores/useDataStore";
import { useCallback, useEffect } from "react";
import { useGetSimpleData } from "./useGetSimpleData";
import { mapStoriesToSummaries } from "@/stores/getSummaryViaFetch";
import { usePrevious } from "react-use";
import { getCleanPathName } from "./getCleanPathName";

export function useGetPageData(
  _pathname: string | null,
  _ssrData: HnItem[] | undefined
) {
  const pathname = getCleanPathName(_pathname || "");

  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);
  const dataNonce = useDataStore((s) => s.dataNonce);

  console.log("useGetPageData", dataNonce, _ssrData);

  // throw out SSR data if data nonce has changed - client requested new data
  const ssrData = dataNonce === 0 ? _ssrData : undefined;

  const saveStoryList = useDataStore((s) => s.saveStoryList);

  useEffect(() => {
    console.log("saving story list", pathname, ssrData);
    if (!pathname || !ssrData || dataNonce !== 0) return;

    saveStoryList(pathname as any, ssrData);
  }, [pathname, ssrData, saveStoryList, dataNonce]);

  // TODO: need to wire up isInit automatically
  const getter = useCallback(() => {
    if (!pathname) return Promise.resolve(undefined);

    console.log("calling for page data", pathname);

    return getContentForPage(pathname);
  }, [getContentForPage, pathname, isInit, dataNonce]);

  const ssrSummaries = mapStoriesToSummaries(ssrData);

  return useGetSimpleData(getter, ssrSummaries);
}
