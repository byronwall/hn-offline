import { HnStoryList } from "~/components/HnStoryList";
import { useGetLocalData } from "./useGetLocalData";

export default function LocalPage() {
  const dataToUse = useGetLocalData();

  return <HnStoryList items={dataToUse} />;
}
