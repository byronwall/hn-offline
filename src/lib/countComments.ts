import { isValidComment } from "./isValidComment";

import type { KidsObj3 } from "~/models/interfaces";

// Count visible comments in a tree, optionally only those that match.
export function countComments(
  comments: Array<KidsObj3 | null> | undefined,
  matches: (comment: KidsObj3) => boolean = () => true
): number {
  let count = 0;
  for (const comment of comments ?? []) {
    if (!isValidComment(comment)) {
      continue;
    }
    if (matches(comment)) {
      count += 1;
    }
    count += countComments(comment.kidsObj, matches);
  }
  return count;
}
