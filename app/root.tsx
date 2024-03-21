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
  useEffect(() => {
    console.log("App useEffect initLocalForage");
    initLocalForage();
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
      </head>
      <body className="bg-orange-50">
        <main className="bg-white mx-auto flex min-h-screen flex-col items-center justify-between pb-24 max-w-[640px] w-full ">
          <NavBar />

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
