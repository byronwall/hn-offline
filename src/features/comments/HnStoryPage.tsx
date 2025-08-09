import { useNavigate } from "@solidjs/router";
import { createEffect, Match, onMount, Show, Switch } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { createHasRendered } from "~/lib/createHasRendered";
import { isValidComment } from "~/lib/isValidComment";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { cn, getDomain, timeSince } from "~/lib/utils";
import { setActiveStoryData } from "~/stores/activeStorySignal";
import { setScrollToId } from "~/stores/scrollSignal";
import {
  collapsedTimestamps,
  updateCollapsedState,
} from "~/stores/useCommentStore";
import { HnItem, useDataStore } from "~/stores/useDataStore";
import { saveIdToReadList } from "~/stores/useReadItemsStore";

import { HnCommentList } from "./HnCommentList";

interface HnStoryPageProps {
  id: number | undefined;
  storyData: HnItem;
}

export const HnStoryPage = (props: HnStoryPageProps) => {
  // using persisted comment store utilities

  const hasRendered = createHasRendered();

  const textToRender = () =>
    processHtmlAndTruncateAnchorText(props.storyData?.text || "");

  const handleShareClick = () => {
    navigator.share?.({ url: window.location.href });
  };

  const navigate = useNavigate();

  const initializeLocalStorage = useDataStore(
    (s) => s.initializeFromLocalForage
  );
  // initialize comment store from persisted storage on mount

  onMount(() => {
    // initialize local storage
    initializeLocalStorage();
  });

  createEffect(() => {
    // update the global story data when it changes
    setActiveStoryData(props.storyData);
  });

  onMount(() => {
    const anchorClickHandler = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.tagName !== "A") {
        return;
      }

      const link = e.target as HTMLAnchorElement;

      if (!link || !link.href) {
        return;
      }

      const regex = /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;
      const matches = link.href.match(regex);

      if (matches === null) {
        // TODO: this is definitely breaking links when navigating around - find a better way
        // link.target = "_blank";
        return;
      }

      navigate("/story/" + matches[1]);
      e.preventDefault();
      return false;
    };

    window.scrollTo({ top: 0 });
    document.body.addEventListener("click", anchorClickHandler);

    if (props.id !== undefined) {
      saveIdToReadList(props.id);
    }

    return () => {
      document.body.removeEventListener("click", anchorClickHandler);
    };
  });

  // Guard against scenarios which remove DOM node too early
  // Need SSR to match the DOM
  // need comment store to be ready
  const isTextOpen = () =>
    !hasRendered() ||
    (props.storyData?.id &&
      collapsedTimestamps[props.storyData.id] === undefined);

  const comments = () => (props.storyData.kidsObj || []).filter(isValidComment);

  function handleStoryTextClick() {
    if (!props.storyData?.text) {
      return;
    }

    const newIsCollapsed = !!isTextOpen();
    updateCollapsedState(props.storyData.id, newIsCollapsed);

    // scroll to first comment if it exists
    // schedule out 200ms to allow the collapse animation to finish
    setTimeout(() => {
      const firstCommentId = comments()[0]?.id;
      if (newIsCollapsed && firstCommentId) {
        setScrollToId(firstCommentId);
      }
    }, 100);
  }

  return (
    <div class="relative">
      <h2
        class="text-2xl font-bold hover:underline mb-2"
        style={{ "overflow-wrap": "break-word" }}
      >
        <Switch>
          <Match when={props.storyData.url === undefined}>
            <span>{props.storyData.title}</span>
          </Match>
          <Match when={props.storyData.url !== undefined}>
            <a href={props.storyData.url}>{props.storyData.title}</a>
          </Match>
        </Switch>
      </h2>

      <div
        class={cn({
          "border-l-4 border-orange-500 px-2 rounded-tl rounded-bl":
            props.storyData.text,
          collapsed: !isTextOpen(),
        })}
        onClick={handleStoryTextClick}
      >
        <h4 class="mb-2">
          <span>{props.storyData.by}</span>
          <span>{" | "}</span>
          <span>
            {props.storyData.score}
            {" points"}
          </span>
          <span>{" | "}</span>
          <span>{timeSince(props.storyData.time)} ago</span>
          <span>{" | "}</span>
          <span>{getDomain(props.storyData.url)}</span>

          <span>{" | "}</span>
          <button onClick={handleShareClick} class="hover:text-orange-500">
            <ArrowUpRightFromSquare size={16} />
          </button>
        </h4>

        <Show when={props.storyData.text !== undefined && isTextOpen()}>
          <div>
            {/*  eslint-disable-next-line solid/no-innerhtml */}
            <p class="user-text break-words " innerHTML={textToRender()} />
          </div>
        </Show>
      </div>

      <div class="user-text">
        <HnCommentList childComments={comments()} depth={0} authorChain={[]} />
      </div>
    </div>
  );
};
