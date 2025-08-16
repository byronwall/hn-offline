import { Accessor, createResource, ResourceReturn } from "solid-js";
import { isServer } from "solid-js/web";

export type ResourceSource = "client" | "server";

export function createUniversalResource<T>({
  clientCallback,
  serverCallback,
  id,
}: {
  id: Accessor<any>;
  clientCallback: () => Promise<T>;
  serverCallback: () => Promise<T>;
}): ResourceReturn<{ source: ResourceSource; data: Awaited<T> }, unknown> {
  return createResource(id(), async (idParam) => {
    // this thing evaluates when the data is requested...
    console.log("*** createUniversalResource", idParam);
    console.log("*** isServer", isServer);

    return isServer
      ? {
          source: "server" as ResourceSource,
          data: await serverCallback(),
        }
      : {
          source: "client" as ResourceSource,
          data: await clientCallback(),
        };
  });
}
