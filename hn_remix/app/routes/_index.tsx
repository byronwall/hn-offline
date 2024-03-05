import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { StoryListPage } from "~/components/StoryListPage";
import { loader as listLoader } from "./api.topstories.$type";

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

export default function Index() {
  // loader data
  const data = useLoaderData();

  return <StoryListPage data={data} />;
}
