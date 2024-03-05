import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";

import { StoryListPage } from "~/components/StoryListPage";
import { loader as listLoader } from "./api.topstories.$type";
import { useDataStore } from "~/stores/useDataStore";

export const meta: MetaFunction = ({ params }) => {
  // capitalize the first letter of the type
  const type = params.type?.charAt(0).toUpperCase() + params.type?.slice(1);

  return [
    { title: "HN Offline: " + type },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const type = params.type;

  console.log("loader", type, new Date());

  return await listLoader({
    params: {
      type,
    },
  });
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  // this action will run only on a CSR request - client side navigation
  // will not call the server loader function
  console.log("clientLoader", params.id);

  const data = useDataStore.getState().getContentForPage(params.type);

  return data;
};

export default function Index() {
  // loader data
  const data = useLoaderData();

  return <StoryListPage data={data} />;
}
