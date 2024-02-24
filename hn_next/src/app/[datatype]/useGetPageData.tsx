"use client";
import { useDataStore } from "../stores/useDataStore";
import { useCallback } from "react";
import { useGetSimpleData } from "./page";

export function useGetPageData(pathname: string) {
  const getContentForPage = useDataStore((s) => s.getContentForPage);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);

  // TODO: need to wire up isInit automatically
  const getter = useCallback(
    () => getContentForPage(pathname),
    [getContentForPage, pathname, isInit]
  );

  return useGetSimpleData(getter);
}
