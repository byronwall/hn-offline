// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { createHandler, StartServer } from "@solidjs/start/server";

// Global server-side unhandled error logging
if (typeof process !== "undefined" && process?.on) {
  console.log("*** server unhandled error logging");

  process.on("uncaughtException", (error) => {
    console.log("Uncaught exception", error.name, error.message, error.stack);
  });
  process.on("unhandledRejection", (reason) => {
    console.log("Unhandled promise rejection", reason);
  });
  process.on("uncaughtExceptionMonitor", (error) => {
    console.log("Uncaught exception monitor", error);
  });
  process.on("warning", (warning) => {
    console.log(
      "Process warning",
      warning.name,
      warning.message,
      warning.stack
    );
  });
  process.on("rejectionHandled", (promise) => {
    console.log("Rejection later handled", promise);
  });
  process.on("multipleResolves", (type, promise, value) => {
    console.log("Multiple resolves", type, promise, value);
  });
  process.on("beforeExit", (code) => {
    console.log("Process beforeExit", code);
  });
  process.on("exit", (code) => {
    console.log("Process exit", code);
  });
  (["SIGINT", "SIGTERM", "SIGHUP", "SIGUSR1", "SIGUSR2"] as const).forEach(
    (signal) => {
      try {
        process.on(signal, () => {
          console.log("Received signal", signal);
        });
      } catch {
        // some signals may not be available on all platforms
      }
    }
  );
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
