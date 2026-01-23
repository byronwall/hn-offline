import { addMessage } from "./messages";
import { createPersistedStore } from "./createPersistedStore";

import type { StoryPage } from "~/models/interfaces";

export type RefreshTimestampStore = Record<StoryPage, number>;

export const [refreshTimestamps, setRefreshTimestamps, { waitingToLoad }] =
  createPersistedStore("REFRESH_TIMESTAMPS", {} as RefreshTimestampStore);

export const [
  refreshRequestedTimestamps,
  setRefreshRequestedTimestamps,
  { waitingToLoad: waitingToLoadRequested },
] = createPersistedStore(
  "REFRESH_REQUESTED_TIMESTAMPS",
  {} as RefreshTimestampStore
);

export function setRefreshTimestamp(page: StoryPage, ts?: number) {
  const now = ts ?? Math.floor(Date.now() / 1000);
  addMessage("refresh", "setRefreshTimestamp", { page, ts: now });
  setRefreshTimestamps(page, now);
}

export function setRefreshRequestedTimestamp(page: StoryPage, ts?: number) {
  const now = ts ?? Math.floor(Date.now() / 1000);
  addMessage("refresh", "setRefreshRequestedTimestamp", { page, ts: now });
  setRefreshRequestedTimestamps(page, now);
}
