import { STORY_TYPE } from "@/models/interfaces";
import { cachedData } from "@/server/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  // return a set of 30 stories with the title, comment count, and URL
  // add those to the DB and set some flag saying that they need full details loaded
  // load the first layer and note that more could be loaded
  // store those top stories for some period of time

  let reqType = params.type;

  if (STORY_TYPE.indexOf(reqType as any) === -1) {
    console.log("sending 500", reqType);
    return NextResponse.json({ error: "Invalid type" });
  }

  const results = cachedData[reqType] ?? [];
  console.log("sending results", results?.length);

  return NextResponse.json(results);
}
