import { Meta, Title } from "@solidjs/meta";
import { isServer } from "solid-js/web";

import { TopStoriesType } from "~/models/interfaces";

import { ServerStoryList } from "./ServerStoryList";

export function StoryListRoute(props: { page: TopStoriesType }) {
  console.log("*** StoryListRoute", { isServer, page: props.page });

  const title = () =>
    props.page === "topstories"
      ? "Top"
      : props.page.charAt(0).toUpperCase() + props.page.slice(1);

  return (
    <>
      <Title>HN Offline: {title()}</Title>
      <Meta name="description" content={`Hacker News ${props.page} page`} />
      {/* TODO: add a suspense here to trigger the skeleton */}
      <ServerStoryList page={props.page} />
    </>
  );
}
