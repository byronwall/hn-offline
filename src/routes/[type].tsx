import { useParams } from "@solidjs/router";
import { Match, Switch } from "solid-js";

import { ServerStoryPage } from "~/features/storyList/ServerStoryPage";
import { TopStoriesType } from "~/models/interfaces";

import Offline from "./offline";

export default function StoryPage() {
  const params = useParams();
  const type = params.type as TopStoriesType;

  return (
    <Switch>
      <Match when={type === "offline"}>
        <Offline />
      </Match>
      <Match when={true}>
        <ServerStoryPage page={type ?? ("topstories" as TopStoriesType)} />
      </Match>
    </Switch>
  );
}
