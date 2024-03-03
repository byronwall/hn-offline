import { getContentViaFetch } from "@/stores/getContentViaFetch";
import { StoryPageClient } from "../../../components/StoryPageClient";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: {
    id: string;
  };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const id = params.id;

  // fetch data
  const data = await getContentViaFetch("/api/story/" + id);

  const parentMetadata = await parent;

  if (!data) {
    return parentMetadata as Metadata;
  }

  return {
    ...parentMetadata,
    title: "HN Offline - " + data.title,
  } as Metadata;
}

export default async function StoryListPageServer({ params }: Props) {
  const data = await getContentViaFetch("/api/story/" + params.id);

  console.log("ssr story data @ server", params.id, data?.title);

  return <StoryPageClient ssrData={data} />;
}
