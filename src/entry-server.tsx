// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

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
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="apple-mobile-web-app-title" content="HN Offline" />
          {assets}
          <script
            defer
            src="https://as8ws0w.apps.byroni.us/script.js"
            data-website-id="b0a4cc50-7c62-4999-b77f-e277452a636c"
          />
        </head>
        <body class="relative bg-orange-50">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
