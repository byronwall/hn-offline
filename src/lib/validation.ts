import { z } from "zod";

/**
 * Enhanced Zod validation with improved error messages
 *
 * This module provides validation functions with detailed error messages that show:
 * - Expected type vs received type
 * - Actual received values for debugging
 * - Field paths for easy location of issues
 * - Specific error details for different validation types
 *
 * Example error messages:
 * - "Expected number, received string (value: "123") at score"
 * - "String too short: minimum 1 characters required at title"
 * - "Number too small: minimum 0 required at time"
 * - "Invalid URL format at url"
 * - "Array too small: minimum 1 items required"
 */

// Base schema for common HN item fields
const baseHnItemSchema = z.object({
  id: z
    .number("Item ID must be a number")
    .int("Item ID must be an integer")
    .positive("Item ID must be positive"),

  time: z
    .number("Timestamp must be a number")
    .int("Timestamp must be an integer")
    .min(0, "Timestamp must be non-negative"),

  by: z
    .string("Author name must be a string")
    .min(1, "Author name cannot be empty"),

  type: z
    .string("Item type must be a string")
    .min(1, "Item type cannot be empty"),

  lastUpdated: z
    .number("Last updated timestamp must be a number")
    .int("Last updated timestamp must be an integer")
    .min(0, "Last updated timestamp must be non-negative"),
});

// Schema for comment objects

// Schema for HnItem (main story/item schema)
const hnItemSchema = baseHnItemSchema.extend({
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
const hnItemWithCommentsSchema = hnItemSchema.extend({
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

// Schema for array of HnItems

// Schema for HnStorySummary (story summary schema)

// Schema for array of HnStorySummaries

export type ValidatedHnItemWithComments = z.infer<
  typeof hnItemWithCommentsSchema
>;

export type ValidationResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Helper function to format error messages with better details
function formatZodError(err: any): string {
  const path = err.path.length > 0 ? ` at ${err.path.join(".")}` : "";

  // Handle different types of Zod errors with specific formatting
  let errorDetails = err.message;

  // Add more context for type mismatches
  if (err.code === "invalid_type") {
    const expected = err.expected || "unknown type";
    const received = err.received || "unknown";
    errorDetails = `Expected ${expected}, received ${received}`;

    // Add received value for better debugging
    if (err.received !== undefined) {
      const receivedValue =
        err.received === "undefined"
          ? "undefined"
          : err.received === "null"
            ? "null"
            : typeof err.received === "string"
              ? `"${err.received}"`
              : String(err.received);
      errorDetails += ` (value: ${receivedValue})`;
    }
  }

  // Handle string validation errors
  else if (err.code === "too_small" && err.type === "string") {
    errorDetails = `String too short: minimum ${err.minimum} characters required`;
  } else if (err.code === "too_big" && err.type === "string") {
    errorDetails = `String too long: maximum ${err.maximum} characters allowed`;
  }

  // Handle number validation errors
  else if (err.code === "too_small" && err.type === "number") {
    errorDetails = `Number too small: minimum ${err.minimum} required`;
  } else if (err.code === "too_big" && err.type === "number") {
    errorDetails = `Number too large: maximum ${err.maximum} allowed`;
  }

  // Handle array validation errors
  else if (err.code === "too_small" && err.type === "array") {
    errorDetails = `Array too small: minimum ${err.minimum} items required`;
  } else if (err.code === "too_big" && err.type === "array") {
    errorDetails = `Array too large: maximum ${err.maximum} items allowed`;
  }

  // Handle invalid string format errors
  else if (err.code === "invalid_string") {
    if (err.validation === "url") {
      errorDetails = `Invalid URL format`;
    } else {
      errorDetails = `Invalid string format: ${err.validation}`;
    }
  }

  return `${errorDetails}${path}`;
}

// General validation function that can be used with any Zod schema
function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = "Validation"
): ValidationResponse<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errorMessages = result.error.issues.map(formatZodError);

  return {
    success: false,
    error: `${context} failed:\n${errorMessages.join("\n")}`,
  };
}

export function validateHnItemWithComments(
  data: unknown
): ValidationResponse<ValidatedHnItemWithComments> {
  return validateWithSchema(
    hnItemWithCommentsSchema,
    data,
    "Item with comments validation"
  );
}
