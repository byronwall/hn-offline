import { STORY_TYPE } from "~/models/interfaces";
import { cachedData } from "~/server/server";

import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  const reqType = params.type;

  console.log("reqType", reqType);

  if (!reqType || STORY_TYPE.indexOf(reqType as any) === -1) {
    console.log("sending 500", reqType);
    return { error: "Invalid type" };
  }

  const results = cachedData[reqType] ?? [];
  console.log("sending results", results?.length);

  return results;
}
