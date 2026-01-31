import { createLocalForageStore } from "./localforage";
import { createCommentStore } from "./useCommentStore";
import { createDataStore } from "./useDataStore";
import { createReadItemsStore } from "./useReadItemsStore";
import { createRefreshStore } from "./useRefreshStore";

import type { AddMessage } from "./messages";
import type { createStoryUiStore } from "./storyUiStore";

export function createLocalDataStore(params: {
  addMessage: AddMessage;
  storyUi: ReturnType<typeof createStoryUiStore>;
}) {
  const localForage = createLocalForageStore(params.addMessage);
  const readItems = createReadItemsStore(
    params.addMessage,
    localForage.localForage
  );
  const refresh = createRefreshStore(
    params.addMessage,
    localForage.localForage
  );
  const data = createDataStore({
    addMessage: params.addMessage,
    localForage: localForage.localForage,
    readItemsStore: readItems,
    refreshStore: refresh,
    storyUi: params.storyUi,
  });
  const comments = createCommentStore({
    addMessage: params.addMessage,
    localForage: localForage.localForage,
    storyUi: params.storyUi,
  });

  return {
    localForage: localForage.localForage,
    localForageReady: localForage.isReady,
    initializeLocalForage: localForage.initializeLocalForage,
    readItems,
    refresh,
    data,
    comments,
  };
}
