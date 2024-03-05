import type { MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs } from "@remix-run/react";

import HnStoryListServer, {
  loader as listLoader,
  clientLoader as commonClientLoader,
} from "./$type";

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
  return listLoader({ params: { type: "topstories" } });
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  return commonClientLoader({ params: { type: "topstories" } });
};

export default function Index() {
  return <HnStoryListServer />;
}
