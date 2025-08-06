import { isValidComment } from "~/lib/isValidComment";

import { KidsObj3 } from "./useDataStore";

export function findNextSibling(
  _comments: (KidsObj3 | null)[],
  searchId: number,
  nextParentId: number | undefined,
  collapsedIds: Record<number, true>
): number | undefined {
  let found = false;

  // apply same filtering logic as comment rendering
  const comments = _comments.filter(isValidComment);

  for (const comment of comments) {
    if (comment === null) {
      continue;
    }

    if (found && !collapsedIds[comment.id]) {
      // only scroll to open comments
      return comment.id;
    }

    if (comment.id === searchId) {
      found = true;
    }
  }

  if (found) {
    // no next sibling, return parent
    return nextParentId;
  }

  let nextSiblingId: number | undefined = 0;

  for (let idx = 0; idx < comments.length; idx++) {
    const comment = comments[idx];
    if (comment === null) {
      continue;
    }

    if (nextSiblingId === -2) {
      if (!collapsedIds[comment.id]) {
        console.log("next parent", nextParentId, comment.id);
        return comment.id;
      }
      continue;
    }

    // recurse into kidsObj - still need to find the comment
    // default is the next comment's id
    nextSiblingId = findNextSibling(
      comment.kidsObj || [],
      searchId,
      -2,
      collapsedIds
    );

    // check if -1 came out, if so, return
    const nextId = comments[idx + 1]?.id;

    if (nextSiblingId === -2 && nextId && !collapsedIds[nextId]) {
      return nextId;
    }

    if (nextSiblingId && nextSiblingId > 0 && !collapsedIds[nextSiblingId]) {
      return nextSiblingId;
    }
  }

  return nextSiblingId;
}
