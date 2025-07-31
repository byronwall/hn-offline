import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, onMount, Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { isValidComment } from "~/lib/isValidComment";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { cn, getDomain, timeSince } from "~/lib/utils";
import { HnItem, useDataStore } from "~/stores/useDataStore";

import { HnCommentList } from "./HnCommentList";

interface HnStoryPageProps {
  id: number | undefined;
  storyData: HnItem;
}

export const HnStoryPage = (props: HnStoryPageProps) => {
  const updateCollapsedState = useDataStore((s) => s.updateCollapsedState);

  const setIdToScrollTo = useDataStore((s) => s.setScrollToId);

  const textToRender = () =>
    processHtmlAndTruncateAnchorText(props.storyData?.text || "");

  const onVisitMarker = useDataStore((s) => s.saveIdToReadList);

  const handleShareClick = () => {
    navigator.share?.({ url: window.location.href });
  };

  const navigate = useNavigate();

  onMount(() => {
    const anchorClickHandler = (e: any) => {
      if (e.target.tagName !== "A") {
        return;
      }

      const link = e.target as HTMLAnchorElement;

      const regex = /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;
      const matches = link.href.match(regex);

      if (matches === null) {
        link.target = "_blank";
        return;
      }

      navigate("/story/" + matches[1]);
      e.preventDefault();
      return false;
    };

    window.scrollTo({ top: 0 });
    document.body.addEventListener("click", anchorClickHandler);

    if (props.id !== undefined) {
      onVisitMarker(props.id);
    }

    return () => {
      document.body.removeEventListener("click", anchorClickHandler);
    };
  });

  const collapsedIds = useDataStore((s) => s.collapsedIds);

  const _isOpen = () =>
    props.storyData?.id ? collapsedIds()[props.storyData.id] !== true : false;
  const [isTextOpen, setIsTextCollapsed] = createSignal(_isOpen());

  createEffect(() => {
    setIsTextCollapsed(_isOpen());
  });

  // TODO: probably a better home for this?
  const setColorMap = useDataStore((s) => s.setColorMap);
  createEffect(() => {
    const colors = getColorsForStory(props.storyData);
    setColorMap(colors);
  });

  const isTextCollapsed = () => isTextOpen() === false;

  const storyLinkEl =
    props.storyData.url === undefined ? (
      <span>{props.storyData.title}</span>
    ) : (
      <a href={props.storyData.url}>{props.storyData.title}</a>
    );

  const comments = (props.storyData.kidsObj || []).filter(isValidComment);

  function handleStoryTextClick() {
    if (!props.storyData?.text) {
      return;
    }

    const newIsCollapsed = !isTextCollapsed();

    setIsTextCollapsed(newIsCollapsed);
    updateCollapsedState(props.storyData.id, newIsCollapsed);

    // scroll to first comment if it exists
    // schedule out 200ms to allow the collapse animation to finish
    setTimeout(() => {
      if (newIsCollapsed && comments.length > 0 && comments[0]?.id) {
        setIdToScrollTo(comments[0]?.id);
      }
    }, 100);
  }

  return (
    <div class="relative">
      <h2
        class="text-2xl font-bold hover:underline mb-2"
        style={{ "overflow-wrap": "break-word" }}
      >
        {storyLinkEl}
      </h2>

      <div
        class={cn(
          {
            "border-l-4 border-orange-500 px-2 rounded-tl rounded-bl":
              props.storyData.text,
          },
          {
            collapsed: isTextCollapsed(),
          }
        )}
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

        <Show when={props.storyData.text !== undefined && !isTextCollapsed()}>
          {/* TODO: this is not working... */}
          {/*  eslint-disable-next-line solid/no-innerhtml */}
          <p class="user-text break-words " innerHTML={textToRender()} />
        </Show>
      </div>

      <div class="user-text">
        <HnCommentList childComments={comments} depth={0} authorChain={[]} />
      </div>
    </div>
  );
};
