import { createResource, ResourceReturn } from "solid-js";
import { isServer } from "solid-js/web";

import { ValidationResponse } from "./validation";

/**
 * Configuration options for the universal data fetcher
 */
export interface UniversalFetcherOptions<T> {
  validateResponse?: (data: any) => ValidationResponse<T>;
  onError?: (error: Error) => void;
  fetchOptions?: RequestInit;
}

type ResourceSource = "client" | "server";

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
): ResourceReturn<{ source: ResourceSource; data: Awaited<T> }, unknown> {
  return createResource(
    // eslint-disable-next-line solid/reactivity
    async () => {
      try {
        if (isServer) {
          // On server, call the server function directly
          const result = await serverCallback();

          // Validate response if validator is provided
          if (options?.validateResponse && !options.validateResponse(result)) {
            throw new Error("Invalid response format from server");
          }

          return { source: "server" as ResourceSource, data: result };
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

        return { source: "client" as ResourceSource, data: result };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        options?.onError?.(new Error(errorMessage));
        throw error;
      }
    }
  );
}
