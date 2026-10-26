import { Show } from "solid-js";

import { ArrowUpRightFromSquare } from "~/components/Icon";
import { useRelativeTime } from "~/contexts/AppDataContext";
import { scrollToNext } from "~/lib/scroll";
import { shareHnTextContent } from "~/lib/shareHnTextContent";
import { getDomain, shareSafely } from "~/lib/utils";

import type { HnItem } from "~/models/interfaces";

type HnStoryMetaRowProps = {
  story?: HnItem | undefined;
  newCount: number;
};

// Points · author · age · comments (· N new) · domain · share
export const HnStoryMetaRow = (props: HnStoryMetaRowProps) => {
  const relativeTime = useRelativeTime();
  const domain = () => getDomain(props.story?.url)?.replace(/^www\./, "");

  // Text posts share their text; link posts share this page.
  const handleShareClick = async () => {
    const story = props.story;
    if (story?.text) {
      await shareHnTextContent({
        contentLabel: "Story",
        contentId: story.id,
        author: story.by,
        contentHtml: story.text,
        storyId: story.id,
      });
      return;
    }
    await shareSafely({ url: window.location.href });
  };

  return (
    <div class="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] text-slate-500">
      <Show when={props.story?.score !== undefined}>
        <span class="text-slate-700">{props.story?.score} points</span>
        <Dot />
      </Show>
      <span class="text-hn-ink font-medium">{props.story?.by}</span>
      <Dot />
      <span>{relativeTime(props.story?.time, true)}</span>
      <Show when={props.story?.descendants !== undefined}>
        <Dot />
        <span class="whitespace-nowrap">
          {props.story?.descendants} comments
          <Show when={props.newCount > 0}>
            {" "}
            <button
              type="button"
              class="text-hn-ink font-medium hover:underline"
              onClick={() => scrollToNext("[data-new-comment]")}
            >
              ({props.newCount} new)
            </button>
          </Show>
        </span>
      </Show>
      <Show when={domain()}>
        <Dot />
        <span class="truncate font-mono text-[14px]">{domain()}</span>
      </Show>
      <button
        type="button"
        onClick={handleShareClick}
        class="hover:text-hn-ink ml-1 text-slate-400 transition-colors duration-150"
        aria-label="Share"
      >
        <ArrowUpRightFromSquare width={16} height={16} />
      </button>
    </div>
  );
};

function Dot() {
  return (
    <span class="text-slate-300 select-none" aria-hidden="true">
      ·
    </span>
  );
}
