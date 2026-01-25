import { For } from "solid-js";

import { HnCommentSkeleton } from "./HnCommentSkeleton";

interface HnCommentSkeletonListProps {
  count?: number;
}

export function HnCommentSkeletonList(props: HnCommentSkeletonListProps) {
  const count = () => props.count ?? 4;
  const indices = () => Array.from({ length: count() }, (_, index) => index);

  return <For each={indices()}>{() => <HnCommentSkeleton />}</For>;
}
