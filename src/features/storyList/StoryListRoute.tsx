import { Meta, Title } from "@solidjs/meta";

import { TopStoriesType } from "~/models/interfaces";

import { ServerStoryPage } from "./ServerStoryPage";

export function StoryListRoute(props: { page: TopStoriesType }) {
  const title = () =>
    props.page === "topstories"
      ? "Top"
      : props.page.charAt(0).toUpperCase() + props.page.slice(1);

  return (
    <>
      <Title>HN Offline: {title()}</Title>
      <Meta name="description" content={`Hacker News ${props.page} page`} />
      <ServerStoryPage page={props.page} />
    </>
  );
}

export default StoryListRoute;
