import { useNavigate } from "@solidjs/router";
import {
  createMemo,
  createRenderEffect,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { PullToRefresh } from "~/components/PullToRefresh";
import { createHasRendered } from "~/lib/createHasRendered";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { isValidComment } from "~/lib/isValidComment";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { cn, getDomain, timeSince } from "~/lib/utils";
import { activeStoryData } from "~/stores/activeStorySignal";
import { setColorMap } from "~/stores/colorMap";
import { addMessage } from "~/stores/messages";
import { setScrollToId } from "~/stores/scrollSignal";
import { isOfflineMode } from "~/stores/serviceWorkerStatus";
import {
  collapsedTimestamps,
  updateCollapsedState,
} from "~/stores/useCommentStore";
import { isLoadingData, refreshActive } from "~/stores/useDataStore";
import { saveIdToReadList } from "~/stores/useReadItemsStore";

import { HnCommentList } from "./HnCommentList";

interface HnStoryPageProps {
  id: number | undefined;
}

export const HnStoryPage = (props: HnStoryPageProps) => {
  const hasRendered = createHasRendered();

  const textToRender = () =>
    processHtmlAndTruncateAnchorText(activeStoryData()?.text || "");

  const handleShareClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      navigator.share?.({ url: window.location.href });
    } catch {
      // ignore
    }
  };

  const navigate = useNavigate();

  createRenderEffect(() => {
    if (!activeStoryData()) {
      return;
    }

    addMessage("HnStoryPage", "update color map");

    const colors = getColorsForStory(activeStoryData());
    setColorMap(colors);
  });

  onMount(() => {
    if (props.id === undefined) {
      return;
    }
    saveIdToReadList(props.id);
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

      const pathName = new URL(link.href).pathname;

      const internalPaths = ["/story", "/day", "/week", "/month"];
      if (internalPaths.some((path) => pathName.startsWith(path))) {
        // let the navigation happen
        return;
      }

      const regex = /https?:\/\/news\.ycombinator\.com\/item\?id=(\d+)/;
      const matches = link.href.match(regex);

      if (matches === null) {
        // external link = open in new tab
        link.target = "_blank";
        return;
      }

      // we have an HN link - reroute internally
      navigate("/story/" + matches[1]);
      e.preventDefault();
      return false;
    };

    document.body.addEventListener("click", anchorClickHandler);

    onCleanup(() => {
      document.body.removeEventListener("click", anchorClickHandler);
    });
  });

  // Guard against scenarios which remove DOM node too early
  // Need SSR to match the DOM
  // need comment store to be ready
  const isTextOpen = () =>
    !hasRendered() ||
    (activeStoryData()?.id &&
      collapsedTimestamps[activeStoryData()!.id] === undefined);

  const comments = () =>
    (activeStoryData()?.kidsObj || []).filter(isValidComment);

  function handleStoryTextClick() {
    if (!activeStoryData()?.text) {
      return;
    }

    const newIsCollapsed = !!isTextOpen();
    updateCollapsedState(activeStoryData()!.id, newIsCollapsed);

    // scroll to first comment if it exists
    // schedule out 200ms to allow the collapse animation to finish
    setTimeout(() => {
      const firstCommentId = comments()[0]?.id;
      if (newIsCollapsed && firstCommentId) {
        setScrollToId(firstCommentId);
      }
    }, 100);
  }

  const pullMessage = createMemo(() => {
    const ts = activeStoryData()?.lastUpdated;
    return ts ? `Updated ${timeSince(ts)} ago` : undefined;
  });

  return (
    <PullToRefresh
      disabled={isLoadingData() || isOfflineMode()}
      onRefresh={refreshActive}
      message={pullMessage()}
    >
      <div class="relative pb-[70vh]">
        <h2
          class="mb-2 text-2xl font-bold hover:underline"
          style={{ "overflow-wrap": "break-word" }}
        >
          <Switch>
            <Match when={activeStoryData()?.url === undefined}>
              <span>{activeStoryData()?.title}</span>
            </Match>
            <Match when={activeStoryData()?.url !== undefined}>
              <a href={activeStoryData()?.url}>{activeStoryData()?.title}</a>
            </Match>
          </Switch>
        </h2>

        <div
          class={cn({
            "rounded-tl rounded-bl border-l-4 border-orange-500 px-2":
              activeStoryData()?.text,
            collapsed: !isTextOpen(),
          })}
          onClick={handleStoryTextClick}
        >
          <h4 class="mb-2">
            <span>{activeStoryData()?.by}</span>
            <span>{" | "}</span>
            <span>
              {activeStoryData()?.score}
              {" points"}
            </span>
            <span>{" | "}</span>
            <span>{timeSince(activeStoryData()?.time)} ago</span>
            <span>{" | "}</span>
            <span>{getDomain(activeStoryData()?.url)}</span>

            <Show when={pullMessage()}>
              <span>
                <span>{" | "}</span>
                <span class="text-xs text-slate-400">{pullMessage()}</span>
              </span>
            </Show>

            <span>{" | "}</span>
            <button onClick={handleShareClick} class="hover:text-orange-500">
              <ArrowUpRightFromSquare size={16} />
            </button>
          </h4>

          <Show when={activeStoryData()?.text !== undefined && isTextOpen()}>
            <div>
              {/*  eslint-disable-next-line solid/no-innerhtml */}
              <p class="user-text break-words" innerHTML={textToRender()} />
            </div>
          </Show>
        </div>

        <div class="user-text">
          <HnCommentList
            childComments={comments()}
            depth={0}
            authorChain={[]}
          />
        </div>
      </div>
    </PullToRefresh>
  );
};
