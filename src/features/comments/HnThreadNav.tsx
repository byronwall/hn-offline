import { Show } from "solid-js";

import { ChevronUp } from "~/components/Icon";
import { scrollToNext } from "~/lib/scroll";

type HnThreadNavProps = {
  newCount: number;
};

// Floating controls for long threads: skip to the next top-level thread, or
// to the next comment posted since the last visit.
export function HnThreadNav(props: HnThreadNavProps) {
  const buttonClass =
    "pointer-events-auto flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 text-sm text-slate-700 shadow-sm backdrop-blur transition-colors duration-150 hover:border-hn/40 hover:text-hn-ink active:bg-hn-soft";

  return (
    <div class="pointer-events-none fixed inset-x-0 bottom-4 z-10 mx-auto flex max-w-[640px] justify-end gap-2 px-3">
      <Show when={props.newCount > 0}>
        <button
          type="button"
          class={buttonClass}
          onClick={() => scrollToNext("[data-new-comment]")}
          title="Next new comment"
        >
          <span class="font-medium text-hn-ink">{props.newCount} new</span>
          <ChevronUp width="16" height="16" class="rotate-180" />
        </button>
      </Show>
      <button
        type="button"
        class={buttonClass}
        onClick={() => scrollToNext("[data-thread-start]")}
        title="Next thread"
        aria-label="Next thread"
      >
        Next thread
        <ChevronUp width="16" height="16" class="rotate-180" />
      </button>
    </div>
  );
}
