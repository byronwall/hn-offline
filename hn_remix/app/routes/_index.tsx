import type { MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";

import { StoryListPage } from "~/components/StoryListPage";
import { loader as listLoader } from "./api.topstories.$type";
import { useDataStore } from "~/stores/useDataStore";

export const meta: MetaFunction = () => {
  return [
    { title: "HN Offline" },
    {
      name: "description",
      content: "Hacker News client built for offline usage",
    },
  ];
};

export async function loader() {
  return await listLoader({
    params: {
      type: "topstories",
    },
  });
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  // this action will run only on a CSR request - client side navigation
  // will not call the server loader function
  console.log("clientLoader", params.id);

  const data = useDataStore.getState().getContentForPage("topstories");

  return data;
};

export default function Index() {
  // loader data
  const data = useLoaderData();

  return <StoryListPage data={data} />;
}
