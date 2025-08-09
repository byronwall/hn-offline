import { StoryPage } from "~/stores/useDataStore";

export function isStoryPage(page: string): page is StoryPage {
  return page === "front" || page === "day" || page === "week";
}

export function convertPathToStoryPage(pathname: string): StoryPage {
  // remove leading slash if present
  if (pathname.startsWith("/")) {
    pathname = pathname.slice(1);
  }

  if (pathname === "") {
    pathname = "topstories";
  }

  // TODO: reconcile these types
  if (pathname === "topstories") {
    return "front";
  }

  if (!isStoryPage(pathname)) {
    throw new Error("Invalid pathname: " + pathname);
  }

  return pathname;
}
