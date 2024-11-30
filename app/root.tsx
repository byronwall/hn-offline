import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { useEffect } from "react";
import { NavBar } from "./components/NavBar";
import { useDataStore } from "./stores/useDataStore";
import styles from "./tailwind.css";
import { useCommentStore } from "./features/comments/indexedDb";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: styles },
];

export const meta = () => [
  { title: "HN Offline" },
  { name: "description", content: "Hacker News Offline" },
];

export default function App() {
  const initLocalForage = useDataStore((s) => s.initializeFromLocalForage);

  const fetchInitialCollapsedState = useCommentStore(
    (s) => s.fetchInitialCollapsedState
  );

  useEffect(() => {
    console.log("App useEffect initLocalForage");
    initLocalForage();
    fetchInitialCollapsedState();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="HN Offline" />
        <Links />
        <Meta />

        <script
          defer
          src="https://as8ws0w.apps.byroni.us/script.js"
          data-website-id="b0a4cc50-7c62-4999-b77f-e277452a636c"
        ></script>
      </head>
      <body className="bg-orange-50 relative">
        <main className="bg-white mx-auto flex min-h-screen flex-col items-center justify-between pb-24 max-w-[640px] w-full ">
          <div className="sticky top-0 bg-white z-10 w-full">
            <NavBar />
          </div>

          <div className="border flex-1 w-full p-1">
            <Outlet />
          </div>
        </main>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export const ErrorBoundary = () => {
  return <div> Major Error </div>;
};
