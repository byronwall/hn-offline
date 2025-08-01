import { createResource } from "solid-js";

import { ValidationResponse } from "./validation";

/**
 * Configuration options for the universal data fetcher
 */
export interface UniversalFetcherOptions<T> {
  initialValue?: T;
  name?: string;
  validateResponse?: (data: any) => ValidationResponse<T>;
  onError?: (error: Error) => void;
  fetchOptions?: RequestInit;
}

/**
 * Helper function to create a client callback that fetches from a URL
 * @param url - The API endpoint URL
 * @param fetchOptions - Optional fetch options
 * @returns A client callback function
 */
export function createClientCallback<T>(
  url: string,
  fetchOptions?: RequestInit
): () => Promise<T> {
  return async () => {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json() as Promise<T>;
  };
}

/**
 * A general purpose helper for fetching data that works on both server and client
 * @param clientCallback - The client-side function to call for fetching data
 * @param serverCallback - The server-side function to call directly
 * @param options - Optional configuration
 * @returns A SolidJS resource with the fetched data
 */
export function createUniversalResource<T>(
  clientCallback: () => Promise<T>,
  serverCallback: () => Promise<T>,
  options?: UniversalFetcherOptions<T>
) {
  return createResource(
    // eslint-disable-next-line solid/reactivity
    async () => {
      try {
        if (typeof window === "undefined") {
          // On server, call the server function directly
          const result = await serverCallback();

          // Validate response if validator is provided
          if (options?.validateResponse && !options.validateResponse(result)) {
            throw new Error("Invalid response format from server");
          }

          return result;
        }

        // On client, call the client callback
        const result = await clientCallback();

        // Validate response if validator is provided

        const validationResult = options?.validateResponse?.(result);

        if (validationResult && validationResult.success === false) {
          console.error(validationResult.error);
          console.error(result);
          throw new Error(validationResult.error);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        options?.onError?.(new Error(errorMessage));
        throw error;
      }
    },
    {
      initialValue: options?.initialValue,
      name: options?.name,
    }
  );
}
