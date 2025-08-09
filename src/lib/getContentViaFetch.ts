import { HnItem } from "~/models/interfaces";

export async function getContentViaFetch(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error("Failed to fetch", { url });
    console.error(response);
    return undefined;
  }
  const data: HnItem | { error: string } = await response.json();

  if (!data || "error" in data) {
    console.error(data);

    return undefined;
  }

  return data;
}
