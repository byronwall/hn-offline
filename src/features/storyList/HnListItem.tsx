import { A } from "@solidjs/router";

import { ChevronUp, MessageSquareQuote } from "~/components/Icon";
import { cn, getDomain, timeSince } from "~/lib/utils";
import { HnStorySummary, useDataStore } from "~/stores/useDataStore";

export interface HnStoryProps {
  data: HnStorySummary;
}

export function HnListItem(props: HnStoryProps) {
  const readIds = useDataStore((s) => s.readItems);

  return (
    <div
      class={cn("grid grid-cols-subgrid col-span-4", {
        "opacity-20": readIds()[props.data.id] !== undefined,
      })}
    >
      <p class="col-span-4 mt-1.5 font-medium mb-1 hover:underline">
        {props.data.url === undefined ? (
          <A href={"/story/" + props.data.id}>{props.data.title}</A>
        ) : (
          <a href={props.data.url} target="_blank" rel="noreferrer">
            {props.data.title}
          </a>
        )}
      </p>

      <span class="flex gap-1 text-gray-700 ">
        <ChevronUp class="stroke-gray-500" />
        {props.data.score}
      </span>
      {props.data.descendants !== undefined && (
        <A
          href={"/story/" + props.data.id}
          class="flex gap-1 text-gray-700 hover:underline"
        >
          <MessageSquareQuote class="stroke-gray-500" />
          {props.data.descendants}
        </A>
      )}
      <span class="text-gray-600 text-right mr-2">
        {timeSince(props.data.time)}
      </span>
      <span class="truncate text-gray-400">{getDomain(props.data.url)}</span>
    </div>
  );
}
