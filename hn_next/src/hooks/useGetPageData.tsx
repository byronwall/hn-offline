"use client";
import { useDataStore } from "../stores/useDataStore";
import { useCallback } from "react";
import { useGetSimpleData } from "./useGetSimpleData";

export function useGetPageData(pathname: string | null) {
  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);
  const dataNonce = useDataStore((s) => s.dataNonce);

  // TODO: need to wire up isInit automatically
  const getter = useCallback(() => {
    if (!pathname) return Promise.resolve(undefined);

    console.log("calling for page data", pathname);

    return getContentForPage(pathname);
  }, [getContentForPage, pathname, isInit, dataNonce]);

  return useGetSimpleData(getter);
}
