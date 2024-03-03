"use client";
import { HnItem, useDataStore } from "../stores/useDataStore";
import { useCallback, useEffect } from "react";
import { useGetSimpleData } from "./useGetSimpleData";
import { mapStoriesToSummaries } from "@/stores/getSummaryViaFetch";

export function useGetPageData(_pathname: string | null, ssrData: HnItem[]) {
  const pathname = getCleanPathName(_pathname || "");

  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);
  const dataNonce = useDataStore((s) => s.dataNonce);

  const saveStoryList = useDataStore((s) => s.saveStoryList);

  useEffect(() => {
    console.log("saving story list", pathname, ssrData);
    if (!pathname || !ssrData) return;

    saveStoryList(pathname as any, ssrData);
  }, [pathname, ssrData, saveStoryList]);

  // TODO: need to wire up isInit automatically
  const getter = useCallback(() => {
    if (!pathname) return Promise.resolve(undefined);

    console.log("calling for page data", pathname);

    return getContentForPage(pathname);
  }, [getContentForPage, pathname, isInit, dataNonce]);

  const ssrSummaries = mapStoriesToSummaries(ssrData);

  return useGetSimpleData(getter, ssrSummaries);
}

function getCleanPathName(pathname: string) {
  // remove leading slash if present
  if (pathname.startsWith("/")) {
    pathname = pathname.slice(1);
  }

  if (pathname === "") {
    pathname = "topstories";
  }

  return pathname;
}
