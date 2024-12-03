import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";

import { HnStoryPage } from "~/features/comments/HnStoryPage";
import { getDomain } from "~/lib/utils";
import { HnItem, useDataStore } from "~/stores/useDataStore";

import { loader as storyLoader } from "./api.story.$id";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || "error" in data) {
    return [
      { title: "HN Offline" },
      {
        name: "description",
        content: "Hacker News Offline",
      },
    ];
  }

  if (data.type === "comment") {
    return [
      { title: "HN Offline Comment by " + data.by },
      {
        name: "description",
        content: `${data.text}`,
      },
    ];
  }

  return [
    { title: "HN Offline: " + data.title },
    {
      name: "description",
      content: `${data.score} points at ${getDomain(data.url)} by ${
        data.by
      } - ${data.descendants} comments`,
    },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  // this action will run only on a SSR request - direct load of URL
  console.log("loader", params, new Date());
  const id = params.id;
  const data = await storyLoader({ params: { id } });

  return data;
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  // this action will run only on a CSR request - client side navigation
  // will not call the server loader function
  console.log("clientLoader story", params.id);

  const data = await useDataStore.getState().getContent(params.id);

  return data;
};

export default function Story() {
  const data = useLoaderData<HnItem>();
  const id = data?.id;

  return (
    <div>
      <HnStoryPage id={id} storyData={data} key={id} />
    </div>
  );
}
