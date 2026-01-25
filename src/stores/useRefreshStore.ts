import type { Accessor } from "solid-js";

import { createPersistedStore } from "./createPersistedStore";
import type { AddMessage } from "./messages";

import type { StoryPage } from "~/models/interfaces";

export type RefreshTimestampStore = Record<StoryPage, number>;

export type RefreshStore = {
  refreshTimestamps: RefreshTimestampStore;
  refreshRequestedTimestamps: RefreshTimestampStore;
  setRefreshTimestamp: (page: StoryPage, ts?: number) => void;
  setRefreshRequestedTimestamp: (page: StoryPage, ts?: number) => void;
  waitingToLoad: Promise<boolean>;
  waitingToLoadRequested: Promise<boolean>;
};

export function createRefreshStore(
  addMessage: AddMessage,
  localForage: Accessor<LocalForage | undefined>
): RefreshStore {
  const [refreshTimestamps, setRefreshTimestamps, { waitingToLoad }] =
    createPersistedStore("REFRESH_TIMESTAMPS", {} as RefreshTimestampStore, localForage);

  const [
    refreshRequestedTimestamps,
    setRefreshRequestedTimestamps,
    { waitingToLoad: waitingToLoadRequested },
  ] = createPersistedStore(
    "REFRESH_REQUESTED_TIMESTAMPS",
    {} as RefreshTimestampStore,
    localForage
  );

  const setRefreshTimestamp = (page: StoryPage, ts?: number) => {
    const now = ts ?? Math.floor(Date.now() / 1000);
    addMessage("refresh", "setRefreshTimestamp", { page, ts: now });
    setRefreshTimestamps(page, now);
  };

  const setRefreshRequestedTimestamp = (page: StoryPage, ts?: number) => {
    const now = ts ?? Math.floor(Date.now() / 1000);
    addMessage("refresh", "setRefreshRequestedTimestamp", { page, ts: now });
    setRefreshRequestedTimestamps(page, now);
  };

  return {
    refreshTimestamps,
    refreshRequestedTimestamps,
    setRefreshTimestamp,
    setRefreshRequestedTimestamp,
    waitingToLoad,
    waitingToLoadRequested,
  };
}
