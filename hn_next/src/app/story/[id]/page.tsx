"use client";

import { useGetContent } from "@/hooks/useGetContent";
import { HnStoryPage } from "@/components/HnStoryPage";
import { useParams } from "next/navigation";

export default function Home() {
  const params = useParams();

  const rawId = params?.id;

  if (Array.isArray(rawId) || !rawId) {
    throw new Error("Unexpected array");
  }

  const id = parseInt(rawId, 10);

  const { data, isLoading } = useGetContent(id);

  return (
    <div>
      {isLoading && <p>Loading...</p>}

      <HnStoryPage id={id} onVisitMarker={console.log} storyData={data} />
    </div>
  );
}
