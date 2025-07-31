import { useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { HnItem } from "~/stores/useDataStore";

export default function Story() {
  const params = useParams();
  const id = +params.id;

  const [data] = createResource(async () => {
    // TODO: for the client - need to check local storage for the data
    console.log("is server?", typeof window === "undefined");
    console.log("import.meta.env", import.meta.env);

    const response = await fetch(`http://localhost:3000/api/story/${id}`);
    return response.json() as Promise<HnItem>;
  });

  console.log("id", id, data());

  return (
    <div>
      <Show when={data()} fallback={<div>Loading...</div>}>
        {(data) => <HnStoryPage id={id} storyData={data()} />}
      </Show>
      <pre>{JSON.stringify(data(), null, 2)}</pre>
    </div>
  );
}
