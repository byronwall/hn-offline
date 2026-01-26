import { createEffect, Match, onMount, Switch } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import {
  useAppData,
  useColorMapStore,
  useDataStore,
  useMessagesStore,
  useReadItemsStore,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { getColorsForStory } from "~/lib/getColorsForStory";
import { isValidComment } from "~/lib/isValidComment";

import { HnCommentList } from "./HnCommentList";
import { HnCommentSkeletonList } from "./HnCommentSkeletonList";
import { HnStoryCommentBanner } from "./HnStoryCommentBanner";
import { HnStoryContentCard } from "./HnStoryContentCard";
import { HnStoryTitle } from "./HnStoryTitle";

import type { HnItem } from "~/models/interfaces";

interface HnStoryPageProps {
  id: number | undefined;
  story?: HnItem | undefined;
  startedFromServer: boolean;
}

export const HnStoryPage = (props: HnStoryPageProps) => {
  const colorMapStore = useColorMapStore();
  const messagesStore = useMessagesStore();
  const serviceWorker = useServiceWorkerStore();
  const dataStore = useDataStore();
  const readItemsStore = useReadItemsStore();

  const story = () => props.story;
  const isClientMounted = useAppData().isClientMounted;

  createEffect(() => {
    if (!story()) {
      return;
    }

    messagesStore.addMessage("HnStoryPage", "update color map");
    colorMapStore.setColorMap(getColorsForStory(story()));
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

  const comments = () => (story()?.kidsObj || []).filter(isValidComment);
  const showSkeleton = () => props.startedFromServer && !isClientMounted();

  return (
    <PullToRefresh
      disabled={dataStore.isLoadingData() || serviceWorker.isOfflineMode()}
      onRefresh={dataStore.refreshActive}
    >
      <div class="relative pb-[70vh]">
        <HnStoryCommentBanner story={story()} />
        <HnStoryTitle story={story()} />
        <HnStoryContentCard
          story={story()}
          firstCommentId={comments()[0]?.id}
        />

        <Switch>
          {/* NOTE: showing a skeleton on comments to avoid complexity in hydration */}
          <Match when={showSkeleton()}>
            <HnCommentSkeletonList />
          </Match>
          <Match when={!showSkeleton()}>
            <HnCommentList
              childComments={comments()}
              depth={0}
              authorChain={[]}
            />
          </Match>
        </Switch>
      </div>
    </PullToRefresh>
  );
};
