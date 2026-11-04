// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { Show } from "solid-js";

// GA4 Measurement ID. Swap this when hn.byroni.us gets its own property.
const GA_ID = "G-GQQ3NPGZYD";
const gtagInit = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","${GA_ID}");`;

// Log instead of crashing the server on a stray async error.
if (typeof process !== "undefined" && process?.on) {
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception", error);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection", reason);
  });
}

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f5f4" />
          <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0c0e11" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="apple-mobile-web-app-title" content="HN Offline" />
          {assets}
          <Show when={import.meta.env.PROD}>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script innerHTML={gtagInit} />
          </Show>
        </head>
        <body class="relative bg-stone-100">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
