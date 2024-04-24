/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import * as Sentry from "@sentry/browser";

// TODO: make this an environment variable
Sentry.init({
  dsn: "https://3b80771b89684f458ac049432eaf81b5@occ4w04.apps.byroni.us/1",
});

// load service worker @ sw.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // registration worked
        console.log("Registration succeeded.");
        registration.update();
      })
      .catch((error) => {
        // registration failed
        console.error(`Registration failed with ${error}`);
      });
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
