import { StoryListPage } from "@/components/StoryListPage";
import { getSummaryViaFetch } from "@/stores/getSummaryViaFetch";

export default async function Home() {
  const { data } = await getSummaryViaFetch("/api/topstories/topstories");

  console.log("ssr data @ server", "/ front", data.length);

  return <StoryListPage data={data} />;
}
