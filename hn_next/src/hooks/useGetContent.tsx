"use client";
import { useDataStore } from "../stores/useDataStore";
import { useCallback } from "react";
import { useGetSimpleData } from "./useGetSimpleData";

export function useGetContent(id: number) {
  const getContent = useDataStore((s) => s.getContent);
  const isInit = useDataStore((s) => s.isLocalForageInitialized);

  const getter = useCallback(() => getContent(id), [getContent, id, isInit]);

  return useGetSimpleData(getter);
}
