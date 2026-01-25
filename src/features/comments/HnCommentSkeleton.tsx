import { createSignal, For, onMount } from "solid-js";

export function HnCommentSkeleton() {
  const MAX_LINES = 6;
  const MIN_LINES = 3;
  const [visibleCount, setVisibleCount] = createSignal(MAX_LINES);
  const lines = Array.from({ length: MAX_LINES }, (_, index) => index);

  onMount(() => {
    const nextCount =
      Math.floor(Math.random() * (MAX_LINES - MIN_LINES + 1)) + MIN_LINES;
    setVisibleCount(nextCount);
  });

  return (
    <div class="bp3-card relative overflow-hidden" aria-hidden="true">
      <div class="flex items-center gap-2">
        <div class="comment-skeleton-shimmer h-4 w-24 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
        <div class="comment-skeleton-shimmer h-3 w-16 rounded-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
      </div>
      <div class="mt-2 space-y-2">
        <For each={lines}>
          {(lineIndex) => (
            <div
              hidden={lineIndex >= visibleCount()}
              class="comment-skeleton-shimmer h-3 w-full rounded-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
            />
          )}
        </For>
      </div>
    </div>
  );
}
