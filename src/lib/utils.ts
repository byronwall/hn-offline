import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function timeSince(date: number | undefined, addAgo: boolean = false) {
  if (date === undefined) {
    return "";
  }

  const suffix = addAgo ? " ago" : "";

  const seconds = Math.floor(new Date().getTime() / 1000 - date);
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + "yr" + suffix;
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + "mon" + suffix;
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + "day" + suffix;
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + "hr" + (interval > 1 ? "s" : "") + suffix;
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + "min" + suffix;
  }

  if (interval < 1) {
    // do not add suffix for now
    return "just now";
  }

  return Math.floor(seconds) + "sec" + suffix;
}
export function getDomain(url: string | undefined) {
  if (url === undefined) {
    return "";
  }
  const matches = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
  const domain = matches && matches[1];
  return domain;
}
export function _getUnixTimestamp() {
  return Math.floor(new Date().valueOf() / 1000);
}

export const isNavigator = typeof navigator !== "undefined";

export async function shareSafely(options: ShareData): Promise<void> {
  if (!isNavigator || !navigator.share) {
    return;
  }

  try {
    await navigator.share(options);
  } catch (err) {
    const error = err as { name?: string; message?: string };
    if (error?.name === "AbortError" || error?.message === "Share canceled") {
      return;
    }
    // ignore other share errors
  }
}
