import {
  type ValidatedHnItem,
  type ValidatedHnItemWithComments,
  validateHnItemArray,
  validateHnItemWithComments,
} from "./validation";

export function validateHnItemArrayAsTypeGuard(
  data: any
): data is ValidatedHnItem[] {
  return validateHnItemArray(data).success;
}

export function validateHnItemWithCommentsAsTypeGuard(
  data: any
): data is ValidatedHnItemWithComments {
  return validateHnItemWithComments(data).success;
}
