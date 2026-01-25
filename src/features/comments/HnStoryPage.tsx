import { createEffect, onMount } from "solid-js";

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
    console.log("*** HnStoryPage skeleton check", {
      startedFromServer: props.startedFromServer,
      isClientMounted: isClientMounted(),
    });
  });

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

        <HnCommentList
          childComments={comments()}
          depth={0}
          authorChain={[]}
          skeletonOnly={props.startedFromServer && !isClientMounted()}
        />
      </div>
    </PullToRefresh>
  );
};
