import { Meta, Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { Match, Switch } from "solid-js";

import Offline from "~/components/offline";
import { ServerStoryPage } from "~/features/storyList/ServerStoryPage";
import { TopStoriesType } from "~/models/interfaces";

export default function StoryPage() {
  const params = useParams();
  const type = params.type as TopStoriesType;

  return (
    <Switch>
      <Match when={type === "offline"}>
        <Offline />
      </Match>
      <Match when={true}>
        <Title>
          HN Offline: {type?.charAt(0).toUpperCase()}
          {type?.slice(1)}
        </Title>
        <Meta name="description" content={`Hacker News ${type} page`} />
        <ServerStoryPage page={type ?? ("topstories" as TopStoriesType)} />
      </Match>
    </Switch>
  );
}
