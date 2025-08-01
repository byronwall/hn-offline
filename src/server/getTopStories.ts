import { STORY_TYPE } from "~/models/interfaces";

import { cachedData } from "./server";

export async function getTopStories(type: string) {
  "use server";

  if (!type || STORY_TYPE.indexOf(type as any) === -1) {
    console.log("sending 500", type);
    return { error: "Invalid type" };
  }

  const results = cachedData[type] ?? [];

  return results;
}
