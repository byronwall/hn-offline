import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";

import { useEffect, useMemo } from "react";
import HnStoryList from "~/components/HnStoryList";
import { mapStoriesToSummaries } from "~/stores/getSummaryViaFetch";
import { useDataStore } from "~/stores/useDataStore";
import { loader as listLoader } from "./api.topstories.$type";

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

  const res = await listLoader({
    params: {
      type,
    },
  });

  const storyData = await res.json();

  return { data: storyData, source: "server", page: type };
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  // this action will run only on a CSR request - client side navigation
  // will not call the server loader function
  console.log("clientLoader", params.id);

  const data = await useDataStore.getState().getContentForPage(params.type);

  return { data, source: "client", page: params.type };
};

export default function HnStoryListServer() {
  // loader data
  const { data, source, page } = useLoaderData();

  const saveStoryList = useDataStore((s) => s.saveStoryList);

  useEffect(() => {
    if (source === "server") {
      saveStoryList(page, data);
    }
  }, [data, page, saveStoryList, source]);

  const realData = useMemo(() => {
    if (source === "client") {
      return data;
    }

    return mapStoriesToSummaries(data);
  }, [data, source]);

  return <HnStoryList items={realData} />;
}
