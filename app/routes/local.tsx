import { HnStoryList } from "~/features/storyList/HnStoryList";

import { useGetLocalData } from "./useGetLocalData";

export default function LocalPage() {
  const dataToUse = useGetLocalData();

  return <HnStoryList items={dataToUse} sortType="read-then-points" />;
}
