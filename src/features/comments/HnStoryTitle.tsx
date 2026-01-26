import { Match, Switch } from "solid-js";

import type { HnItem } from "~/models/interfaces";

type HnStoryTitleProps = {
  story?: HnItem | undefined;
};

export const HnStoryTitle = (props: HnStoryTitleProps) => {
  const title = () => props.story?.title;
  const url = () => props.story?.url;

  return (
    <h2
      class="track-visited mb-2 text-2xl font-bold hover:underline focus-visible:underline active:underline"
      style={{ "overflow-wrap": "break-word" }}
    >
      <Switch>
        <Match when={url() === undefined}>
          <span>{title()}</span>
        </Match>
        <Match when={url() !== undefined}>
          <a href={url()}>{title()}</a>
        </Match>
      </Switch>
    </h2>
  );
};
