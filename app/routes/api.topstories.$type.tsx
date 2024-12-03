import { json, LoaderFunctionArgs } from "@remix-run/node";

import { STORY_TYPE } from "~/models/interfaces";
import { cachedData } from "~/server/server";

export async function loader({ params }: LoaderFunctionArgs) {
  const reqType = params.type;

  console.log("reqType", reqType);

  if (!reqType || STORY_TYPE.indexOf(reqType as any) === -1) {
    console.log("sending 500", reqType);
    return json({ error: "Invalid type" });
  }

  const results = cachedData[reqType] ?? [];
  console.log("sending results", results?.length);

  return json(results);
}
