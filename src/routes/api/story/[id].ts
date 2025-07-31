import { _getFullDataForIds } from "~/server/database";

import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  const storyId = params.id;

  if (!storyId) {
    return { error: "Invalid story id" };
  }

  const storyData = await _getFullDataForIds([+storyId]);

  // load the single story and then return
  if (storyData.length > 0) {
    return storyData[0];
  }

  return { error: "story not found" };
}
