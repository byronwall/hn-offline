import { createResource } from "solid-js";

/**
 * Configuration options for the universal data fetcher
 */
export interface UniversalFetcherOptions<T> {
  initialValue?: T;
  name?: string;
  validateResponse?: (data: any) => data is T;
  onError?: (error: Error) => void;
  fetchOptions?: RequestInit;
}

/**
 * A general purpose helper for fetching data that works on both server and client
 * @param url - The API endpoint URL for client-side fetching
 * @param serverCallback - The server-side function to call directly
 * @param options - Optional configuration
 * @returns A SolidJS resource with the fetched data
 */
export function createUniversalResource<T>(
  url: string,
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

        // On client, fetch from the API endpoint
        const response = await fetch(url, options?.fetchOptions);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Validate response if validator is provided
        if (options?.validateResponse && !options.validateResponse(data)) {
          throw new Error("Invalid response format from API");
        }

        return data as T;
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
