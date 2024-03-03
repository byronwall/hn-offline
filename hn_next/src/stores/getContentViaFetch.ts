import { ensureUrlIsFullyQualified } from "./ensureUrlIsFullyQualified";
import { HnItem } from "./useDataStore";

export async function getContentViaFetch(url: string) {
  url = ensureUrlIsFullyQualified(url);

  const response = await fetch(url);
  if (!response.ok) {
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
