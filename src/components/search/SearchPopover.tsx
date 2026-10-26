import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { Search } from "~/components/Icon";
import { useDataStore, useServiceWorkerStore } from "~/contexts/AppDataContext";
import { searchStories } from "~/server/searchStories";

import { SearchResultRow } from "./SearchResultRow";

import type { HnStorySummary } from "~/models/interfaces";

const DEBOUNCE_MS = 250;
const MAX_LOCAL = 8;

// Search icon in the nav. Saved stories match as you type (works offline);
// all of HN (Algolia) follows after a short pause.
export function SearchPopover() {
  const dataStore = useDataStore();
  const serviceWorker = useServiceWorkerStore();
  const navigate = useNavigate();
  let rootRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  const [open, setOpen] = createSignal(false);
  const [term, setTerm] = createSignal("");
  const [remote, setRemote] = createSignal<HnStorySummary[]>([]);
  const [remoteStatus, setRemoteStatus] = createSignal<
    "idle" | "loading" | "error"
  >("idle");
  const [activeIndex, setActiveIndex] = createSignal(0);

  const terms = () => term().trim().toLowerCase().split(/\s+/).filter(Boolean);

  const local = createMemo(() => {
    const words = terms();
    if (words.length === 0) {
      return [];
    }
    const seen = new Map<number, HnStorySummary>();
    for (const list of Object.values(dataStore.storyListStore)) {
      for (const story of list?.data ?? []) {
        const title = story.title?.toLowerCase() ?? "";
        if (words.every((w) => title.includes(w))) {
          seen.set(story.id, story);
        }
      }
    }
    return [...seen.values()].slice(0, MAX_LOCAL);
  });

  const remoteOnly = () => {
    const localIds = new Set(local().map((s) => s.id));
    return remote().filter((s) => !localIds.has(s.id));
  };
  const allResults = () => [...local(), ...remoteOnly()];

  // Debounced remote search; a newer term cancels the older request.
  createEffect(
    on(term, (value) => {
      setActiveIndex(0);
      const q = value.trim();
      if (q.length < 2 || serviceWorker.isOfflineMode()) {
        setRemote([]);
        setRemoteStatus("idle");
        return;
      }
      let cancelled = false;
      setRemoteStatus("loading");
      const timer = setTimeout(() => {
        searchStories(q)
          .then((results) => !cancelled && setRemote(results))
          .then(() => !cancelled && setRemoteStatus("idle"))
          .catch(() => !cancelled && setRemoteStatus("error"));
      }, DEBOUNCE_MS);
      onCleanup(() => {
        cancelled = true;
        clearTimeout(timer);
      });
    })
  );

  const close = () => setOpen(false);
  const toggle = () => {
    setOpen(!open());
    if (open()) {
      queueMicrotask(() => inputRef?.select());
    }
  };

  onMount(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (open() && !rootRef?.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    onCleanup(() => document.removeEventListener("pointerdown", onPointerDown));
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const count = allResults().length;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown" && count > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp" && count > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + count) % count);
    } else if (e.key === "Enter" && count > 0) {
      navigate(`/story/${allResults()[activeIndex()].id}`);
      close();
    }
  };

  return (
    <div ref={rootRef} class="ml-auto">
      <button
        type="button"
        aria-label="Search"
        aria-expanded={open()}
        title="Search"
        onClick={toggle}
        class="hover:text-hn-ink focus-visible:text-hn-ink -my-3 flex px-2 py-3 text-slate-700 transition-colors duration-150"
      >
        <Search width="22" height="22" />
      </button>

      <Show when={open()}>
        {/* Not `relative` on the root: the panel anchors to the (transformed)
            nav, so it hugs the column's right edge and fits on a phone. */}
        <div class="absolute top-full right-2 z-20 mt-1 w-[min(420px,calc(100%-16px))] rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <input
            ref={inputRef}
            type="search"
            value={term()}
            onInput={(e) => setTerm(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search stories"
            aria-label="Search stories"
            autofocus
            class="focus:border-hn w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-[15px] outline-none"
          />
          <div class="mt-1 max-h-[min(60vh,480px)] min-h-16 overflow-y-auto">
            <Show
              when={terms().length > 0}
              fallback={
                <Hint>Type to search saved stories and all of HN.</Hint>
              }
            >
              <Show when={local().length > 0}>
                <SectionLabel>Saved on this device</SectionLabel>
                <For each={local()}>
                  {(story, index) => (
                    <SearchResultRow
                      story={story}
                      terms={terms()}
                      active={activeIndex() === index()}
                      onPick={close}
                    />
                  )}
                </For>
              </Show>
              <SectionLabel>All of HN</SectionLabel>
              <Show
                when={remoteOnly().length > 0}
                fallback={
                  <Hint>
                    {serviceWorker.isOfflineMode()
                      ? "Connect to search all of HN."
                      : term().trim().length < 2
                        ? "Keep typing to search all of HN."
                        : remoteStatus() === "error"
                          ? "Search failed. Try again."
                          : remoteStatus() === "loading"
                            ? "Searching…"
                            : "No other matches."}
                  </Hint>
                }
              >
                <For each={remoteOnly()}>
                  {(story, index) => (
                    <SearchResultRow
                      story={story}
                      terms={terms()}
                      active={activeIndex() === local().length + index()}
                      onPick={close}
                    />
                  )}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}

function SectionLabel(props: { children: string }) {
  return (
    <p class="px-2 pt-2 pb-1 text-[12px] font-medium tracking-wide text-slate-400 uppercase">
      {props.children}
    </p>
  );
}

function Hint(props: { children: string }) {
  return <p class="px-2 py-3 text-sm text-slate-500">{props.children}</p>;
}
