import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function timeSince(date: number | undefined) {
  if (date === undefined) {
    return "";
  }
  const seconds = Math.floor(new Date().getTime() / 1000 - date);
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + "yr";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + "mon";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + "day";
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + "hr" + (interval > 1 ? "s" : "");
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + "min";
  }
  return Math.floor(seconds) + "sec";
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
