import { clearDatabase } from "~/server/database";

export async function GET() {
  await clearDatabase();
  return { success: true };
}
