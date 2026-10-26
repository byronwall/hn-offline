import { KidsObj3 } from "~/models/interfaces";

// Hide nulls and deleted comments that have no replies to show.
export function isValidComment(
  comment: KidsObj3 | null | undefined
): comment is KidsObj3 {
  if (!comment) {
    return false;
  }
  return !(comment.deleted && !comment.kidsObj?.length);
}
