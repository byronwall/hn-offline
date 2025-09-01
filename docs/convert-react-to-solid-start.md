## Converting a Remix (React) App to SolidStart (SolidJS)

This post walks through how I migrated a Remix-based React app to SolidStart with SolidJS. I’ll cover the biggest conceptual shifts and show real before/after code pulled from this repo’s `master` (Remix/React) and `solid-test` (SolidStart/SolidJS) branches.

We’ll focus on four recurring changes:

- Hooks: converting React hooks to Solid’s `createEffect`, `createMemo`, and signals/stores
- Control flow: replacing early returns with Solid’s `<Switch>/<Match>` and `<Show>`
- State management: replacing Zustand with Solid store + persisted storage
- API/variable usage: converting state variables to function calls (signals/memos)

### 1) Hooks → Solid effects and memos

Solid is reactive-by-default: state is accessed via functions and reactivity is tracked at read time. Side-effects go in `createEffect`. Derived values live in `createMemo`. You rarely need local `useState` when state is derived from a store.

Before (Remix/React) – comment scrolling and open/closed state in `HnComment`:

```tsx
// master: app/features/comments/HnComment.tsx
import { useEffect, useRef, useState } from "react";

export function HnComment({ comment, depth, authorChain }: HnCommentProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const scrollToId = useDataStore((s) => s.scrollToId);
  const collapsedIds = useDataStore((s) => s.collapsedIds);

  const _isOpen = comment?.id ? collapsedIds[comment.id] !== true : false;
  const [isOpen, setIsOpen] = useState(_isOpen);

  useEffect(() => {
    setIsOpen(_isOpen);
  }, [_isOpen]);

  useEffect(() => {
    if (scrollToId !== comment?.id) return;
    const dims = divRef.current?.getBoundingClientRect().top;
    if (dims === undefined) return;
    const newTop = window.scrollY + dims - 88;
    window.scrollTo({ top: newTop, behavior: "smooth" });
    clearScrollToId();
  }, [clearScrollToId, comment?.id, scrollToId]);
}
```

After (Solid) – computed `isOpen` and a focused `createEffect` for scroll:

```tsx
// solid-test: src/features/comments/HnComment.tsx
import { createEffect, createMemo, createSignal } from "solid-js";

export function HnComment(props: HnCommentProps) {
  const [divRef, setDivRef] = createSignal<HTMLDivElement | null>(null);

  const isOpen = () =>
    !hasRendered() ||
    (props.comment?.id && collapsedTimestamps[props.comment.id] === undefined);

  createEffect(() => {
    if (scrollToIdSignal() !== props.comment?.id) return;
    requestAnimationFrame(() => {
      const dims = divRef()?.getBoundingClientRect().top;
      if (dims === undefined) return;
      const newTop = window.scrollY + dims - 88;
      window.scrollTo({ top: newTop, behavior: "smooth" });
      clearScrollToId();
    });
  });
}
```

Key changes:

- Derived state uses functions (`isOpen()`) not variables.
- Side effect `createEffect` reruns when any accessed signal/memo changes.
- Refs use a setter (`ref={setDivRef}`) and are read with `divRef()`.

Another example: incremental comment list rendering moved from an `InfiniteScroll` component to an IntersectionObserver + animation frame pump:

Before (Remix/React):

```tsx
// master: app/features/comments/HnCommentList.tsx
return (
  <InfiniteScrollContainer items={validChildren} itemsToAddOnRefresh={1}>
    {(childComm) => (
      <HnComment
        key={childComm.id}
        comment={childComm}
        depth={depth}
        authorChain={authorChain}
      />
    )}
  </InfiniteScrollContainer>
);
```

After (Solid):

```tsx
// solid-test: src/features/comments/HnCommentList.tsx
const children = createMemo(() => props.childComments.filter(Boolean));
const [visibleCount, setVisibleCount] = createSignal(0);
const visible = createMemo(() =>
  children().slice(0, Math.min(visibleCount(), children().length))
);

createEffect(() => {
  const node = sentinel();
  if (!node) return;
  observer?.disconnect();
  cancelRaf();
  setIntersecting(false);
  observer = new IntersectionObserver(
    ([entry]) => {
      const on = !!entry?.isIntersecting;
      setIntersecting(on);
      if (on) ensurePumpRunning(node);
      else cancelRaf();
    },
    { root: null, rootMargin: `${PAD_PX}px 0px ${PAD_PX}px 0px`, threshold: 0 }
  );
  observer.observe(node);
  queueMicrotask(() => ensurePumpRunning(node));
  onCleanup(() => {
    observer?.disconnect();
    observer = null;
    cancelRaf();
  });
});

return (
  <>
    <For each={visible()}>
      {(child) => (
        <HnComment
          comment={child}
          depth={props.depth}
          authorChain={props.authorChain}
        />
      )}
    </For>
    <Show when={showMore()}>
      <div
        ref={setSentinel}
        style={{ height: "10px", border: "1px solid red" }}
        onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
      />
    </Show>
  </>
);
```

### 2) Control flow: early returns → <Show>/<Switch>/<Match>

Solid favors declarative control flow components over imperative early returns. Remix components often returned `null` when data wasn’t available yet; in Solid, wrap content with `<Show>` or pattern-match with `<Switch>/<Match>`.

Before (Remix/React):

```tsx
// master: app/features/comments/HnStoryPage.tsx
if (!storyData) {
  return null;
}

const storyLinkEl =
  storyData.url === undefined ? (
    <span>{storyData.title}</span>
  ) : (
    <a href={storyData.url}>{storyData.title}</a>
  );
```

After (Solid):

```tsx
// solid-test: src/features/comments/HnStoryPage.tsx
<h2 class="mb-2 text-2xl font-bold hover:underline" style={{ "overflow-wrap": "break-word" }}>
  <Switch>
    <Match when={activeStoryData()?.url === undefined}>
      <span>{activeStoryData()?.title}</span>
    </Match>
    <Match when={activeStoryData()?.url !== undefined}>
      <a href={activeStoryData()?.url}>{activeStoryData()?.title}</a>
    </Match>
  </Switch>
</h2>

<Show when={activeStoryData()?.text !== undefined && isTextOpen()}>
  <p class="user-text break-words" innerHTML={textToRender()} />
</Show>
```

This reads cleaner and makes the reactive reads explicit via function calls like `activeStoryData()`.

### 3) Zustand → Solid stores with persisted storage

The app originally used a large Zustand store. In Solid, we split state into focused stores and signals, persisted via `@solid-primitives/storage` with `localforage`:

Before (Zustand – excerpt):

```ts
// master: app/stores/useDataStore.ts (excerpt)
export const useDataStore = create<DataStore & Actions>((set, get) => ({
  readItems: {},
  activeStoryData: undefined,
  setActiveStoryData: (data) => set({ activeStoryData: data }),
  collapsedIds: {},
  updateCollapsedState: async (commentId, collapsed) => {
    /* indexedDB writes */
  },
  saveContent: async (id, content) => {
    await localforage.setItem("raw_" + id, content);
  },
  getContent: async (id) => {
    /* load from localforage or fetch */
  },
  refreshCurrent: async (url) => {
    /* fetch story or list */
  },
}));
```

After (Solid stores – split and persisted):

```ts
// solid-test: src/stores/useDataStore.ts (story lists + content persistence)
export const [storyListStore, setStoryListStore] = makePersisted(
  createStore<StoryListStore>({} as StoryListStore),
  {
    name: "STORY_LIST_STORE",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as unknown as string,
    deserialize: (value) => value as unknown as StoryListStore,
  }
);

export async function persistStoryList(page: StoryPage, data: HnItem[]) {
  const storySummaries = mapStoriesToSummaries(data);
  const incomingTimestamp = Math.max(
    ...storySummaries.map((i) => i.lastUpdated ?? 0),
    0
  );
  await waitingToLoad; // ensure store is ready
  const current = storyListStore[page];
  if (!current || incomingTimestamp > current.timestamp) {
    setStoryListStore(page, {
      timestamp: incomingTimestamp,
      page,
      data: storySummaries,
    });
  }
  for (const item of data) persistStoryToStorage(item.id, item);
}
```

For read items:

```ts
// solid-test: src/stores/useReadItemsStore.ts
export const [readItems, setReadItems] = makePersisted(
  createStore<TimestampHash>({}),
  {
    name: "READ_ITEMS",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as any,
    deserialize: (value) => value as unknown as TimestampHash,
  }
);

export async function saveIdToReadList(id: number | undefined) {
  if (!id) return;
  await waitingToLoad; // guard until persisted store is hydrated
  setReadItems(id, Date.now());
}
```

And for comment collapse state (previously in IndexedDB manually):

```ts
// solid-test: src/stores/useCommentStore.ts
export const [collapsedTimestamps, setCollapsedTimestamps] = makePersisted(
  createStore<CollapsedTimestampMap>({}),
  {
    name: "COLLAPSED_COMMENTS",
    storage: isServer ? undefined : LOCAL_FORAGE_TO_USE,
    serialize: (value) => unwrap(value) as any,
    deserialize: (v) => v as CollapsedTimestampMap,
  }
);

export function updateCollapsedState(
  commentId: number | undefined,
  collapsed: boolean
) {
  if (!commentId) return;
  const next = { ...collapsedTimestamps };
  if (collapsed) next[commentId] = Date.now();
  else delete next[commentId];
  setCollapsedTimestamps(reconcile(next, { merge: false }));
}
```

This split reduces coupling and makes dependency directions clear. Each store persists only what it owns.

### 4) Variables → function calls (signals and memos)

In Solid, reactive reads are function calls. Anywhere you previously referenced a variable from context or a hook, you likely now call a function: `activeStoryData()` instead of `activeStoryData`, `id()` instead of `id`.

Before (Remix route using loader/clientLoader):

```tsx
// master: app/routes/_index.tsx
export async function loader() {
  return listLoader({ params: { type: "topstories" } });
}
export const clientLoader = async () =>
  commonClientLoader({ params: { type: "topstories" } });
export default function Index() {
  return <HnStoryListServer />;
}
```

After (Solid route with resource + memoized params):

```tsx
// solid-test: src/routes/story/[id].tsx
const params = useParams();
const id = createMemo(() => +params.id);
const [data] = createResource(id, async (idParam) =>
  isServer
    ? { source: "server", data: (await getFullDataForIds([idParam]))[0] }
    : { source: "client", data: await getContent(idParam) }
);

createRenderEffect(() => {
  if (!data()) return;
  setActiveStoryData(data()?.data as HnItem);
  setRefreshType({ type: "story", id: id() });
});
```

Note the use of `id()` and `data()` in expressions—those are reactive function reads, not plain variables.

### Practical migration tips

- Replace most `useEffect` with `createEffect`. If the effect depends on a specific signal only sometimes, pull that part into a `createMemo` and read the memo in the effect.
- Compute derived values with `createMemo`. Avoid setting state you can derive from existing signals/stores.
- Replace inline `return null` branches with `<Show>` and `<Switch>/<Match>`.
- Move from one large Zustand store to multiple Solid stores/signals. Use `makePersisted` to hydrate from `localforage` without manual IndexedDB.
- Update JSX event handlers and refs: `ref={setDivRef}` and read it with `divRef()`.
- Audit all usages of prior variables from hooks. Convert to `fn()` reads for signals/memos/stores.

### Closing thoughts

The Solid port reads more declaratively, with fine-grained reactivity and a clear separation between derived values and side-effects. Persisted Solid stores simplified the data layer by removing a lot of custom glue code. If you follow the four themes above—effects, control flow, stores, and reactive reads—you can migrate most Remix/React codebases to SolidStart with minimal friction and a cleaner runtime model.
