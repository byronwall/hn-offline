import { A } from "@solidjs/router";

import { useRelativeTime } from "~/contexts/AppDataContext";
import { HighlightText } from "~/lib/highlightText";
import { cn, getDomain } from "~/lib/utils";

import type { HnStorySummary } from "~/models/interfaces";

type SearchResultRowProps = {
  story: HnStorySummary;
  terms: string[];
  active: boolean;
  onPick: () => void;
};

export function SearchResultRow(props: SearchResultRowProps) {
  const relativeTime = useRelativeTime();
  const domain = () => getDomain(props.story.url)?.replace(/^www\./, "");

  return (
    <A
      href={`/story/${props.story.id}`}
      onClick={() => props.onPick()}
      class={cn(
        "block rounded-md px-2 py-1.5 transition-colors duration-100",
        props.active ? "bg-slate-100" : "hover:bg-slate-50"
      )}
    >
      <span class="block leading-snug font-medium text-slate-900">
        <HighlightText text={props.story.title ?? ""} terms={props.terms} />
      </span>
      <span class="mt-0.5 block truncate text-[13px] text-slate-500">
        {props.story.score ?? 0} points · {props.story.descendants ?? 0}{" "}
        comments · {relativeTime(props.story.time)}
        {domain() ? ` · ${domain()}` : ""}
      </span>
    </A>
  );
}
