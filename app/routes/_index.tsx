import { ClientLoaderFunctionArgs } from "@remix-run/react";

import HnStoryListServer, {
  clientLoader as commonClientLoader,
  loader as listLoader,
} from "./$type";

export async function loader() {
  return listLoader({ params: { type: "topstories" } });
}

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  return commonClientLoader({ params: { type: "topstories" } });
};

export default function Index() {
  return <HnStoryListServer />;
}
