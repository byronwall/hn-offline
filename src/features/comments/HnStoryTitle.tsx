import { Match, Switch } from "solid-js";

type HnStoryTitleProps = {
  title?: string;
  url?: string;
};

export const HnStoryTitle = (props: HnStoryTitleProps) => {
  return (
    <h2
      class="track-visited mb-2 text-2xl font-bold hover:underline focus-visible:underline active:underline"
      style={{ "overflow-wrap": "break-word" }}
    >
      <Switch>
        <Match when={props.url === undefined}>
          <span>{props.title}</span>
        </Match>
        <Match when={props.url !== undefined}>
          <a href={props.url}>{props.title}</a>
        </Match>
      </Switch>
    </h2>
  );
};
