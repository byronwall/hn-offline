import { useParams } from "@solidjs/router";

import { ServerStoryPage } from "~/features/storyList/ServerStoryPage";
import { TopStoriesType } from "~/models/interfaces";

export default function StoryPage() {
  const params = useParams();
  const type = params.type as TopStoriesType;

  return <ServerStoryPage page={type ?? ("topstories" as TopStoriesType)} />;
}
