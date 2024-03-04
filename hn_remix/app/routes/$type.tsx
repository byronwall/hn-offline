import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { StoryListPage } from "~/components/StoryListPage";
import { loader as listLoader } from "./api.topstories.$type";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
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

export default function Index() {
  // loader data
  const data = useLoaderData();

  return <StoryListPage data={data} />;
}
