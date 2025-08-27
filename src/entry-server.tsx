// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { createHandler, StartServer } from "@solidjs/start/server";

// Global server-side unhandled error logging
if (typeof process !== "undefined" && process?.on) {
  console.log("*** server unhandled error logging");

  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception", error);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection", reason);
  });
} else {
  console.log("*** server unhandled error logging not defined");
}

export default createHandler(() => (
  <MetaProvider>
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <link rel="icon" href="/favicon.ico" />
            <link rel="manifest" href="/manifest.webmanifest" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
              name="apple-mobile-web-app-status-bar-style"
              content="black"
            />
            <meta name="apple-mobile-web-app-title" content="HN Offline" />
            {assets}
            <script
              defer
              src="https://as8ws0w.apps.byroni.us/script.js"
              data-website-id="b0a4cc50-7c62-4999-b77f-e277452a636c"
            />
          </head>
          <body class="bg-orange-50 relative">
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  </MetaProvider>
));
