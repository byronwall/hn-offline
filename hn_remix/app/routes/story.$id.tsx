import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { ClientLoaderFunctionArgs, useLoaderData } from "@remix-run/react";
import { HnStoryPage } from "~/components/HnStoryPage";
import { HnItem, useDataStore } from "~/stores/useDataStore";
import { loader as storyLoader } from "./api.story.$id";

export async function loader({ params }: LoaderFunctionArgs) {
  // this action will run only on a SSR request - direct load of URL
  console.log("loader", params, new Date());
  const id = params.id;
  const data = await storyLoader({ params: { id } });

  return data;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: "HN Offline: " + data.title }];
};

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

  return (
    <div>
      <HnStoryPage id={id} storyData={data} />
    </div>
  );
}
