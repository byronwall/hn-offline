import { createResource, ResourceReturn } from "solid-js";
import { isServer } from "solid-js/web";

type ResourceSource = "client" | "server";

export function createUniversalResource<T>({
  clientCallback,
  serverCallback,
}: {
  clientCallback: () => Promise<T>;
  serverCallback: () => Promise<T>;
}): ResourceReturn<{ source: ResourceSource; data: Awaited<T> }, unknown> {
  return createResource(async () =>
    // this thing evaluates when the data is requested...
    isServer
      ? {
          source: "server" as ResourceSource,
          data: await serverCallback(),
        }
      : {
          source: "client" as ResourceSource,
          data: await clientCallback(),
        }
  );
}
