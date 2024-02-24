"use client";

import { useGetContent } from "@/hooks/useGetContent";
import { HnStoryPage } from "@/components/HnStoryPage";
import { useParams } from "next/navigation";

export default function Home() {
  const { id: rawId } = useParams();

  if (Array.isArray(rawId)) {
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
