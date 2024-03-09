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
    {
      name: "manifest",
      content: "/manifest.json",
    },
    {
      name: "apple-mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "black",
    },
    {
      name: "apple-mobile-web-app-title",
      content: "HN Offline",
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
