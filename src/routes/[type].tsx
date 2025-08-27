import { Meta, Title } from "@solidjs/meta";
import { redirect, useParams } from "@solidjs/router";
import { createEffect, Match, Switch } from "solid-js";
import { isServer } from "solid-js/web";

import Offline from "~/components/offline";
import { ServerStoryPage } from "~/features/storyList/ServerStoryPage";
import { TopStoriesType } from "~/models/interfaces";

export default function StoryPage() {
  const params = useParams();
  const type = () => params.type as TopStoriesType;

  // check for type === "offline"
  // if client, redirect to `/`
  createEffect(() => {
    if (!isServer && type() === "offline") {
      console.log("*** redirecting to / because type is offline");
      redirect("/");
    }
  });

  return (
    <Switch>
      <Match when={type() === "offline"}>
        <Offline />
      </Match>
      <Match when={true}>
        <Title>
          HN Offline: {type()?.charAt(0).toUpperCase()}
          {type()?.slice(1)}
        </Title>
        <Meta name="description" content={`Hacker News ${type()} page`} />
        <ServerStoryPage page={type() ?? ("topstories" as TopStoriesType)} />
      </Match>
    </Switch>
  );
}
