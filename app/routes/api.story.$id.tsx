import { json, LoaderFunctionArgs } from "@remix-run/node";

import { _getFullDataForIds } from "~/server/database";

export async function loader({ params }: LoaderFunctionArgs) {
  const storyId = params.id;

  if (!storyId) {
    return json({ error: "Invalid story id" });
  }

  const storyData = await _getFullDataForIds([+storyId]);

  // load the single story and then return
  if (storyData.length > 0) {
    return json(storyData[0]);
  }

  return json({ error: "story not found" });
}
