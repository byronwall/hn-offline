import { _getFullDataForIds } from "@/server/database";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let storyId = params.id;

  const storyData = await _getFullDataForIds([+storyId]);

  // load the single story and then return
  if (storyData.length > 0) {
    NextResponse.json(storyData[0]);

    return;
  }

  NextResponse.json({ error: "story not found" });
}
