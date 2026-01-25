import { createEffect, Match, onMount, Show, Switch } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { PullToRefresh } from "~/components/PullToRefresh";
import {
  useColorMapStore,
  useCommentStore,
  useDataStore,
  useMessagesStore,
  useReadItemsStore,
  useScrollStore,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { isValidComment } from "~/lib/isValidComment";
import { processHtmlAndTruncateAnchorText } from "~/lib/processHtmlAndTruncateAnchorText";
import { cn, getDomain, shareSafely, timeSince } from "~/lib/utils";

import { HnCommentList } from "./HnCommentList";

import type { HnItem } from "~/models/interfaces";

interface HnStoryPageProps {
  id: number | undefined;
  story?: HnItem | undefined;
}

export const HnStoryPage = (props: HnStoryPageProps) => {
  const colorMapStore = useColorMapStore();
  const messagesStore = useMessagesStore();
  const scrollStore = useScrollStore();
  const serviceWorker = useServiceWorkerStore();
  const commentStore = useCommentStore();
  const dataStore = useDataStore();
  const readItemsStore = useReadItemsStore();

  const story = () => props.story;
  const storyId = () => story()?.id;

  const textToRender = () =>
    processHtmlAndTruncateAnchorText(story()?.text || "");

  const handleShareClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await shareSafely({ url: window.location.href });
  };

  createEffect(() => {
    if (!story()) {
      return;
    }

    messagesStore.addMessage("HnStoryPage", "update color map");

    const colors = getColorsForStory(story());
    colorMapStore.setColorMap(colors);
  });

  onMount(() => {
    if (props.id === undefined) {
      return;
    }
    // Track most recently read for list fade-out UX on back nav
    console.warn("*** setting recently read id", props.id);
    readItemsStore.setRecentlyReadId(props.id);
    readItemsStore.saveIdToReadList(props.id);
  });

  // Guard against scenarios which remove DOM node too early
  // Need SSR to match the DOM
  // need comment store to be ready
  const isTextOpen = () => {
    if (storyId() === undefined) {
      return true;
    }
    return commentStore.collapsedTimestamps[storyId()!] === undefined;
  };

  const comments = () => (story()?.kidsObj || []).filter(isValidComment);

  const isComment = () => story()?.type === "comment";
  const parentId = () => story()?.parent;
  const rootId = () => story()?.root;

  function handleStoryTextClick() {
    if (!story()?.text || storyId() === undefined) {
      return;
    }

    const newIsCollapsed = !!isTextOpen();
    commentStore.updateCollapsedState(storyId()!, newIsCollapsed);

    // scroll to first comment if it exists
    // schedule out 200ms to allow the collapse animation to finish
    setTimeout(() => {
      const firstCommentId = comments()[0]?.id;
      if (newIsCollapsed && firstCommentId) {
        scrollStore.setScrollToId(firstCommentId);
      }
    }, 100);
  }

  return (
    <PullToRefresh
      disabled={dataStore.isLoadingData() || serviceWorker.isOfflineMode()}
      onRefresh={dataStore.refreshActive}
    >
      <div class="relative pb-[70vh]">
        <Show when={isComment() && parentId()}>
          <div class="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            <span class="mr-2 rounded bg-slate-200 px-1.5 py-0.5 font-semibold tracking-wide text-slate-700 uppercase">
              Comment
            </span>
            <span>
              <span class="mr-1">
                {rootId() && rootId() === parentId() ? "root" : "parent"}:
              </span>
              <a
                class="text-orange-600 underline hover:text-orange-500 focus-visible:text-orange-500"
                href={`/story/${parentId()}`}
              >
                {parentId()}
              </a>
              <Show when={rootId() && rootId() !== parentId()}>
                <span class="mr-1 ml-3">root:</span>
                <a
                  class="text-orange-600 underline hover:text-orange-500 focus-visible:text-orange-500"
                  href={`/story/${rootId()}`}
                >
                  {rootId()}
                </a>
              </Show>
            </span>
          </div>
        </Show>
        <h2
          class="track-visited mb-2 text-2xl font-bold hover:underline focus-visible:underline active:underline"
          style={{ "overflow-wrap": "break-word" }}
        >
          <Switch>
            <Match when={story()?.url === undefined}>
              <span>{story()?.title}</span>
            </Match>
            <Match when={story()?.url !== undefined}>
              <a href={story()?.url}>{story()?.title}</a>
            </Match>
          </Switch>
        </h2>

        <div
          class={cn(
            {
              "rounded-tl pr-2 pl-4": story()?.text,
              collapsed: !isTextOpen(),
            },
            "bp3-card"
          )}
          onClick={handleStoryTextClick}
          style={{
            "--flash-color":
              colorMapStore.colorMap()[story()?.by ?? ""] ??
              "hsl(30, 80%, 65%)",
            "padding-left": "16px",
          }}
        >
          <div class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-slate-700">
            <span class="font-medium">{story()?.by}</span>
            <span class="text-slate-300 select-none" aria-hidden="true">
              |
            </span>
            <span>
              {story()?.score}
              {" points"}
            </span>
            <span class="text-slate-300 select-none" aria-hidden="true">
              |
            </span>
            <span>{timeSince(story()?.time)}</span>
            <span class="text-slate-300 select-none" aria-hidden="true">
              |
            </span>
            <span class="truncate font-mono text-[14px] text-slate-600">
              {getDomain(story()?.url)}
            </span>

            <span class="text-slate-300 select-none" aria-hidden="true">
              |
            </span>
            <button
              onClick={handleShareClick}
              class="text-slate-400 hover:text-orange-500"
              aria-label="Share"
            >
              <ArrowUpRightFromSquare width={16} height={16} />
            </button>
          </div>

          <Show when={story()?.text !== undefined && isTextOpen()}>
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
