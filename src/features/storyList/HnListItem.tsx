import { A } from "@solidjs/router";

import { ChevronUp, MessageSquareQuote } from "~/components/Icon";
import { trueIfRendered } from "~/lib/createHasRendered";
import { cn, getDomain, timeSince } from "~/lib/utils";
import { HnStorySummary } from "~/models/interfaces";
import { readItems } from "~/stores/useReadItemsStore";

export interface HnStoryProps {
  data: HnStorySummary;
}

export function HnListItem(props: HnStoryProps) {
  const isRead = trueIfRendered(() => readItems[props.data.id] !== undefined);

  return (
    <div
      class={cn("col-span-4 grid grid-cols-subgrid", {
        "opacity-20": isRead(),
      })}
    >
      <p class="col-span-4 mt-1.5 mb-1 font-medium hover:underline">
        {props.data.url === undefined ? (
          <A href={"/story/" + props.data.id}>{props.data.title}</A>
        ) : (
          <a href={props.data.url} target="_blank" rel="noreferrer">
            {props.data.title}
          </a>
        )}
      </p>

      <span class="flex gap-1 text-gray-700">
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
      <span class="mr-2 text-right text-gray-600">
        {timeSince(props.data.time)}
      </span>
      <span class="truncate text-gray-400">{getDomain(props.data.url)}</span>
    </div>
  );
}
