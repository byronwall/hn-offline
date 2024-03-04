"use client";

import { useGetContent } from "@/hooks/useGetContent";
import { HnStoryPage } from "@/components/HnStoryPage";

import { HnItem, useDataStore } from "@/stores/useDataStore";
import { useParams } from "@remix-run/react";

export function StoryPageClient(props: { ssrData: HnItem | undefined }) {
  const params = useParams();

  const rawId = params?.id;

  if (Array.isArray(rawId) || !rawId) {
    throw new Error("Unexpected array");
  }

  const id = parseInt(rawId, 10);

  const { data } = useGetContent(id, props.ssrData);

  const saveIdToReadList = useDataStore((s) => s.saveIdToReadList);

  return (
    <div>
      <HnStoryPage id={id} onVisitMarker={saveIdToReadList} storyData={data} />
    </div>
  );
}
