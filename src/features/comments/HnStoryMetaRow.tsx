import { Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { getDomain, shareSafely } from "~/lib/utils";

import type { HnItem } from "~/models/interfaces";

type HnStoryMetaRowProps = {
  story?: HnItem | undefined;
};

export const HnStoryMetaRow = (props: HnStoryMetaRowProps) => {
  const score = () => props.story?.score;
  const url = () => props.story?.url;

  const handleShareClick = async () => {
    await shareSafely({ url: window.location.href });
  };

  return (
    <div class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] text-slate-700">
      <Show when={score() !== undefined}>
        <span>
          {score()}
          {" points"}
        </span>
      </Show>
      <Show when={score() !== undefined && url() !== undefined}>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
      </Show>
      <Show when={url() !== undefined}>
        <span class="truncate font-mono text-[14px] text-slate-600">
          {getDomain(url())}
        </span>
      </Show>
      <Show when={score() !== undefined || url() !== undefined}>
        <span class="text-slate-300 select-none" aria-hidden="true">
          |
        </span>
      </Show>
      <button
        onClick={handleShareClick}
        class="text-slate-400 transition-colors hover:text-orange-500"
        aria-label="Share"
      >
        <ArrowUpRightFromSquare width={16} height={16} />
      </button>
    </div>
  );
};
