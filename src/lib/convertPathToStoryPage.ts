import type { StoryPage } from "~/models/interfaces";

function isStoryPage(page: string): page is StoryPage {
  return page === "topstories" || page === "day" || page === "week";
}

export function convertPathToStoryPage(pathname: string): StoryPage {
  // remove leading slash if present
  if (pathname.startsWith("/")) {
    pathname = pathname.slice(1);
  }

  if (pathname === "") {
    pathname = "topstories";
  }

  if (!isStoryPage(pathname)) {
    throw new Error("Invalid pathname: " + pathname);
  }

  return pathname;
}
