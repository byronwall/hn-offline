import { A } from "@solidjs/router";
import { createEffect, Match, onMount, Show, Switch, untrack } from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import {
  useAppData,
  useDataStore,
  useReadItemsStore,
  useServiceWorkerStore,
} from "~/contexts/AppDataContext";
import { isValidComment } from "~/lib/isValidComment";

import { HnCommentList } from "./HnCommentList";
import { HnCommentSkeletonList } from "./HnCommentSkeletonList";
import { HnStoryCommentBanner } from "./HnStoryCommentBanner";
import { HnStoryContentCard } from "./HnStoryContentCard";
import { HnStoryMetaRow } from "./HnStoryMetaRow";
import { HnStoryTitle } from "./HnStoryTitle";

import type { HnItem } from "~/models/interfaces";

interface HnStoryPageProps {
  id: number | undefined;
  story?: HnItem | undefined;
  startedFromServer: boolean;
  notFound: boolean;
}

export const HnStoryPage = (props: HnStoryPageProps) => {
  const serviceWorker = useServiceWorkerStore();
  const dataStore = useDataStore();
  const readItemsStore = useReadItemsStore();

  const story = () => props.story;
  const isClientMounted = useAppData().isClientMounted;

  onMount(() => {
    if (props.id === undefined) {
      return;
    }
    // Track most recently read for list fade-out UX on back nav
    readItemsStore.setRecentlyReadId(props.id);
  });

  // Mark read with the comment count seen, once the story is loaded.
  createEffect(() => {
    const loaded = story();
    if (loaded) {
      untrack(() =>
        readItemsStore.saveIdToReadList(loaded.id, loaded.descendants)
      );
    }
  });

  const comments = () => (story()?.kidsObj || []).filter(isValidComment);
  const notFoundMessage = (
    <div class="py-16 text-center text-gray-600">
      <p class="text-lg">This story is not available.</p>
      <p class="mt-1 text-sm text-gray-500">
        It may not be saved for offline reading yet.
      </p>
      <A href="/" class="mt-4 inline-block text-orange-700 hover:underline">
        Back to top stories
      </A>
    </div>
  );

  const showSkeleton = () => props.startedFromServer && !isClientMounted();

  return (
    <PullToRefresh
      disabled={dataStore.isLoadingData() || serviceWorker.isOfflineMode()}
      onRefresh={dataStore.refreshActive}
    >
      <div class="relative pb-[70vh]">
        <Show when={!props.notFound} fallback={notFoundMessage}>
          <HnStoryCommentBanner story={story()} />
          <HnStoryTitle story={story()} />
          <HnStoryMetaRow story={story()} />
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
                progressive
              />
            </Match>
          </Switch>
        </Show>
      </div>
    </PullToRefresh>
  );
};
