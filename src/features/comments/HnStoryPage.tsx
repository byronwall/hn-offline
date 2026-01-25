import { createEffect, onMount, Show } from "solid-js";

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

import { HnCommentList } from "./HnCommentList";
import { HnStoryCommentBanner } from "./HnStoryCommentBanner";
import { HnStoryContentCard } from "./HnStoryContentCard";
import { HnStoryTitle } from "./HnStoryTitle";

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
        <Show when={isComment() && parentId()} keyed>
          {(parent) => (
            <HnStoryCommentBanner parentId={parent} rootId={rootId()} />
          )}
        </Show>
        <HnStoryTitle title={story()?.title} url={story()?.url} />
        <HnStoryContentCard
          author={story()?.by}
          score={story()?.score}
          time={story()?.time}
          url={story()?.url}
          textHtml={textToRender()}
          hasText={story()?.text !== undefined}
          isTextOpen={isTextOpen()}
          flashColor={
            colorMapStore.colorMap()[story()?.by ?? ""] ?? "hsl(30, 80%, 65%)"
          }
          onToggleText={handleStoryTextClick}
        />

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
