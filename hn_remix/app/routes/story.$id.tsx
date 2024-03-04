// routes/story/$id.tsx

import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { StoryPageClient } from "~/components/StoryPageClient";
import { loader as storyLoader } from "./api.story.$id";

export async function loader({ params }: LoaderFunctionArgs) {
  // this action will run only on a SSR request - direct load of URL
  console.log("loader", params, new Date());
  const id = params.id;
  const data = await storyLoader({ params: { id } });

  return data;
}

/*
export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  // this action will run only on a CSR request - client side navigation
  // will not call the server loader function
  console.log("clientLoader", params.id);

  return { id: params.id, source: "client" };
};
*/

export default function Story() {
  const data = useLoaderData();

  // Use the `id` to fetch and display the story
  return <StoryPageClient ssrData={data} />;
}
