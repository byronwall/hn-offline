import { getSummaryViaFetch } from "@/stores/getSummaryViaFetch";

import { StoryListPage } from "./StoryListPage";

export default async function StoryListPageServer({
  params,
}: {
  params: { datatype: string };
}) {
  const { data } = await getSummaryViaFetch(
    "/api/topstories/" + params.datatype
  );

  console.log("ssr data @ server", params.datatype, data);

  return <StoryListPage data={data} />;
}
