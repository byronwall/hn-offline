import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { HnStoryPage } from "~/components/HnStoryPage";
import { HnItem, useDataStore } from "~/stores/useDataStore";
import { loader as storyLoader } from "./api.story.$id";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: "HN Offline: " + data.title }];
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
  console.log("clientLoader", params.id);

  const data = await useDataStore.getState().getContent(params.id);

  return data;
};

export default function Story() {
  const data = useLoaderData<HnItem>();
  const id = data.id;

  const dataNonce = useDataStore((s) => s.dataNonce);
  const getContent = useDataStore((s) => s.getContent);

  const [realData, setRealData] = useState(data);

  useEffect(() => {
    async function fetchData() {
      const data = await getContent(id);
      if (!data) return;

      setRealData(data);
    }
    fetchData();
  }, [dataNonce, getContent, id]);

  return (
    <div>
      <HnStoryPage id={id} storyData={realData} />
    </div>
  );
}
