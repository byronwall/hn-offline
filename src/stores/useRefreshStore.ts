import { createPersistedStore } from "./createPersistedStore";

import type { StoryPage } from "~/models/interfaces";

export type RefreshTimestampStore = Record<StoryPage, number>;

export const [refreshTimestamps, setRefreshTimestamps, { waitingToLoad }] =
  createPersistedStore("REFRESH_TIMESTAMPS", {} as RefreshTimestampStore);

export function setRefreshTimestamp(page: StoryPage, ts?: number) {
  const now = ts ?? Math.floor(Date.now() / 1000);
  setRefreshTimestamps(page, now);
}
