import { createPersistedStore } from "./createPersistedStore";

import type { AddMessage } from "./messages";
import type { Accessor } from "solid-js";
import type { StoryPage } from "~/models/interfaces";

export type RefreshTimestampStore = Record<StoryPage, number>;

export function createRefreshStore(
  addMessage: AddMessage,
  localForage: Accessor<LocalForage | undefined>
) {
  const [refreshTimestamps, setRefreshTimestamps] = createPersistedStore(
    "REFRESH_TIMESTAMPS",
    {} as RefreshTimestampStore,
    localForage
  );

  const [refreshRequestedTimestamps, setRefreshRequestedTimestamps] =
    createPersistedStore(
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
  };
}
