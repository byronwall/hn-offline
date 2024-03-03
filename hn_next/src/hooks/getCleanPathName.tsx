"use client";

export function getCleanPathName(pathname: string) {
  // remove leading slash if present
  if (pathname.startsWith("/")) {
    pathname = pathname.slice(1);
  }

  if (pathname === "") {
    pathname = "topstories";
  }

  return pathname;
}
