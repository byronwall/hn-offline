"use client";

import { useGetContent } from "@/hooks/useGetContent";
import { HnStoryPage } from "@/components/HnStoryPage";
import { useParams } from "next/navigation";
import { Suspense } from "react";

export default function Home() {
  const { id: rawId } = useParams();

  if (Array.isArray(rawId)) {
    throw new Error("Unexpected array");
  }

  const id = parseInt(rawId, 10);

  const { data, isLoading } = useGetContent(id);

  console.log("data", data, isLoading, id);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      <Suspense fallback={<p>Loading...</p>}>
        <HnStoryPage id={id} onVisitMarker={console.log} storyData={data} />
      </Suspense>
    </div>
  );
}
