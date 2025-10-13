import { getTopStories } from "~/server/getTopStories";

import type { APIEvent } from "@solidjs/start/server";

export const GET = async ({ params }: APIEvent) => {
  return getTopStories(params.type);
};
