# Universal Data Fetcher

A general purpose helper for fetching data that works seamlessly on both server and client sides in SolidJS applications.

## Overview

The `createUniversalResource` function provides a unified way to fetch data that automatically handles:

- Server-side direct function calls
- Client-side API requests
- Type safety and validation
- Error handling

## Basic Usage

```typescript
import {
  createUniversalResource,
  createClientCallback,
} from "~/lib/universalDataFetcher";

const [data] = createUniversalResource<MyDataType>(
  createClientCallback("/api/my-endpoint"),
  () => myServerFunction()
);
```

## Advanced Usage with Validation

```typescript
import {
  createUniversalResource,
  createClientCallback,
} from "~/lib/universalDataFetcher";
import { isMyDataType } from "~/lib/typeGuards";

const [data] = createUniversalResource<MyDataType>(
  createClientCallback("/api/my-endpoint"),
  () => myServerFunction(),
  {
    validateResponse: isMyDataType,
    onError: (error) => console.error("Fetch failed:", error.message),
  }
);
```

## API Reference

### `createUniversalResource<T>(clientCallback, serverCallback, options?)`

**Parameters:**

- `clientCallback: () => Promise<T>` - The client-side function to call for fetching data
- `serverCallback: () => Promise<T>` - The server-side function to call directly
- `options?: UniversalFetcherOptions<T>` - Optional configuration

**Returns:** A SolidJS resource with the fetched data

### `createClientCallback<T>(url, fetchOptions?)`

**Parameters:**

- `url: string` - The API endpoint URL
- `fetchOptions?: RequestInit` - Optional fetch options

**Returns:** A client callback function that fetches from the specified URL

### `UniversalFetcherOptions<T>`

```typescript
interface UniversalFetcherOptions<T> {
  initialValue?: T;
  name?: string;
  validateResponse?: (data: any) => data is T;
  onError?: (error: Error) => void;
  fetchOptions?: RequestInit;
}
```

## Validation

Use the provided validation functions for runtime validation with improved error messages:

```typescript
import {
  validateHnItemArray,
  validateHnItem,
  validateHnItemWithComments,
  validateHnItemArrayAsTypeGuard,
  validateHnItemAsTypeGuard,
  validateHnItemWithCommentsAsTypeGuard,
} from "~/lib/typeGuards";

// For detailed validation with error messages
const validationResult = validateHnItemArray(data);
if (!validationResult.success) {
  console.error("Validation failed:", validationResult.error);
}

// For type guard compatibility (returns boolean)
const [stories] = createUniversalResource<HnItem[]>(
  createClientCallback("/api/stories"),
  () => getStories(),
  { validateResponse: validateHnItemArrayAsTypeGuard }
);

// For single HnItem with comments
const [story] = createUniversalResource<HnItem & { kids?: number[] }>(
  createClientCallback("/api/story/123"),
  () => getStory(123),
  { validateResponse: validateHnItemWithCommentsAsTypeGuard }
);
```

### Validation Functions

- `validateHnItem(data)` - Returns `{ success: true, data }` or `{ success: false, error }`
- `validateHnItemArray(data)` - Validates arrays of HnItems
- `validateHnItemWithComments(data)` - Validates HnItems with comment arrays
- `validateErrorResponse(data)` - Validates error response objects

### Type Guard Wrappers

For backward compatibility with existing code that expects boolean type guards:

- `validateHnItemAsTypeGuard(data)` - Returns `true` if valid, `false` otherwise
- `validateHnItemArrayAsTypeGuard(data)` - Type guard for arrays
- `validateHnItemWithCommentsAsTypeGuard(data)` - Type guard for items with comments
- `validateErrorResponseAsTypeGuard(data)` - Type guard for error responses

## Benefits

1. **Type Safety**: Ensures server and client return the same data type
2. **Runtime Validation**: Optional validation to catch data format issues
3. **Error Handling**: Centralized error handling with custom error callbacks
4. **Flexibility**: Support for custom fetch options and headers
5. **SSR Compatible**: Works seamlessly with server-side rendering
6. **DRY Principle**: Eliminates duplicate server/client logic

## Migration from Manual Pattern

**Before:**

```typescript
const [data] = createResource(async () => {
  if (typeof window === "undefined") {
    return await serverFunction();
  }
  const response = await fetch("/api/endpoint");
  return response.json();
});
```

**After:**

```typescript
const [data] = createUniversalResource<DataType>(
  createClientCallback("/api/endpoint"),
  () => serverFunction()
);
```
