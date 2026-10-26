import { A } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  Match,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";

import { PullToRefresh } from "~/components/PullToRefresh";
import {
  useAppData,
  useDataStore,
  useReadItemsStore,
  useServiceWorkerStore,
  useStoryUiStore,
} from "~/contexts/AppDataContext";
import { countComments } from "~/lib/countComments";
import { isValidComment } from "~/lib/isValidComment";

import { HnCommentList } from "./HnCommentList";
import { HnCommentSkeletonList } from "./HnCommentSkeletonList";
import { HnStoryCommentBanner } from "./HnStoryCommentBanner";
import { HnStoryContentCard } from "./HnStoryContentCard";
import { HnStoryMetaRow } from "./HnStoryMetaRow";
import { HnStoryTitle } from "./HnStoryTitle";
import { HnThreadNav } from "./HnThreadNav";

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
  const storyUiStore = useStoryUiStore();

  const story = () => props.story;
  const isClientMounted = useAppData().isClientMounted;

  onMount(() => {
    storyUiStore.setLastVisitMs(undefined);
    if (props.id === undefined) {
      return;
    }
    // Track most recently read for list fade-out UX on back nav
    readItemsStore.setRecentlyReadId(props.id);
  });

  // Once the story and the read list load: remember the previous visit (to
  // mark newer comments), then mark the story read with its comment count.
  let visitCapturedFor: number | undefined;
  createEffect(() => {
    const loaded = story();
    if (!loaded || !readItemsStore.readItemsHydrated()) {
      return;
    }
    untrack(() => {
      if (visitCapturedFor !== loaded.id) {
        visitCapturedFor = loaded.id;
        storyUiStore.setLastVisitMs(readItemsStore.readItems[loaded.id]);
      }
      readItemsStore.saveIdToReadList(loaded.id, loaded.descendants);
    });
  });

  const comments = () => (story()?.kidsObj || []).filter(isValidComment);
  const newCount = createMemo(() => {
    const since = storyUiStore.lastVisitMs();
    if (!since) {
      return 0;
    }
    return countComments(story()?.kidsObj, (c) => c.time * 1000 > since);
  });
  const notFoundMessage = (
    <div class="py-16 text-center text-gray-600">
      <p class="text-lg">This story is not available.</p>
      <p class="mt-1 text-sm text-gray-500">
        It may not be saved for offline reading yet.
      </p>
      <A href="/" class="text-hn-ink mt-4 inline-block hover:underline">
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
          <HnStoryMetaRow story={story()} newCount={newCount()} />
          <Show when={story()?.text ? story() : undefined}>
            {(s) => <HnStoryContentCard story={s()} />}
          </Show>

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
          <Show when={!showSkeleton() && comments().length > 1}>
            <HnThreadNav newCount={newCount()} />
          </Show>
        </Show>
      </div>
    </PullToRefresh>
  );
};
