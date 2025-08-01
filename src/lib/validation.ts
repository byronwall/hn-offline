import { z } from "zod";

// Base schema for common HN item fields
const baseHnItemSchema = z.object({
  id: z
    .number("Item ID must be a number")
    .int("Item ID must be an integer")
    .positive("Item ID must be positive"),

  by: z
    .string("Author name must be a string")
    .min(1, "Author name cannot be empty"),

  time: z
    .number("Timestamp must be a number")
    .int("Timestamp must be an integer")
    .min(0, "Timestamp must be non-negative"),

  type: z
    .string("Item type must be a string")
    .min(1, "Item type cannot be empty"),

  lastUpdated: z
    .number("Last updated timestamp must be a number")
    .int("Last updated timestamp must be an integer")
    .min(0, "Last updated timestamp must be non-negative"),
});

// Schema for comment objects
export const kidsObj3Schema = z.object({
  id: z
    .number("Comment ID must be a number")
    .int("Comment ID must be an integer")
    .positive("Comment ID must be positive"),

  parent: z
    .number("Parent ID must be a number")
    .int("Parent ID must be an integer")
    .positive("Parent ID must be positive"),

  time: z
    .number("Comment timestamp must be a number")
    .int("Comment timestamp must be an integer")
    .min(0, "Comment timestamp must be non-negative"),

  type: z
    .string("Comment type must be a string")
    .min(1, "Comment type cannot be empty"),

  by: z.string().optional(),
  text: z.string().optional(),
  kidsObj: z.array(z.any()).optional(), // Simplified to avoid circular reference issues
  deleted: z.boolean().optional(),
  dead: z.boolean().optional(),
});

// Schema for HnItem (main story/item schema)
export const hnItemSchema = baseHnItemSchema.extend({
  title: z
    .string("Story title must be a string")
    .min(1, "Story title cannot be empty"),

  score: z
    .number("Story score must be a number")
    .int("Story score must be an integer")
    .min(0, "Story score must be non-negative"),

  descendants: z
    .number()
    .int("Descendants count must be an integer")
    .min(0, "Descendants count must be non-negative")
    .optional(),

  url: z.string().url("URL must be a valid URL").optional(),

  text: z.string().optional(),

  kidsObj: z.array(z.any()).optional(), // Simplified to avoid circular reference issues
});

// Schema for HnItem with comments (extends HnItem)
export const hnItemWithCommentsSchema = hnItemSchema.extend({
  kids: z
    .array(
      z
        .number()
        .int("Kid ID must be an integer")
        .positive("Kid ID must be positive")
    )
    .optional(),
});

// Schema for error responses
export const errorResponseSchema = z.object({
  error: z
    .string("Error message must be a string")
    .min(1, "Error message cannot be empty"),
});

// Schema for array of HnItems
export const hnItemArraySchema = z
  .array(hnItemSchema)
  .min(1, "At least one item is required");

// Type exports for use in other files
export type ValidatedHnItem = z.infer<typeof hnItemSchema>;
export type ValidatedHnItemWithComments = z.infer<
  typeof hnItemWithCommentsSchema
>;
export type ValidatedKidsObj3 = z.infer<typeof kidsObj3Schema>;
export type ValidatedErrorResponse = z.infer<typeof errorResponseSchema>;

export function validateHnItemArray(
  data: unknown
):
  | { success: true; data: ValidatedHnItem[] }
  | { success: false; error: string } {
  const result = hnItemArraySchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues.map((err) => {
    const path = err.path.length > 0 ? ` at ${err.path.join(".")}` : "";
    return `${err.message}${path}`;
  });

  return {
    success: false,
    error: `Array validation failed: ${errorMessages.join(", ")}`,
  };
}

export function validateHnItemWithComments(
  data: unknown
):
  | { success: true; data: ValidatedHnItemWithComments }
  | { success: false; error: string } {
  const result = hnItemWithCommentsSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues.map((err) => {
    const path = err.path.length > 0 ? ` at ${err.path.join(".")}` : "";
    return `${err.message}${path}`;
  });

  return {
    success: false,
    error: `Item with comments validation failed: ${errorMessages.join(", ")}`,
  };
}
