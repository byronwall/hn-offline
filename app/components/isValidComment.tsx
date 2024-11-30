import { KidsObj3 } from "~/stores/useDataStore";

export function isValidComment(comment: KidsObj3 | null) {
  // TODO: these items need to be removed somewhere else
  if (comment === null) {
    return false;
  }
  const isBad =
    comment.deleted &&
    (comment.kidsObj === undefined || comment.kidsObj.length === 0);

  return !isBad;
}
