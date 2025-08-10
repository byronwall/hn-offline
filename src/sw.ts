/// <reference lib="WebWorker" />
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { matchPrecache, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// Populated by VitePWA at build
precacheAndRoute(self.__WB_MANIFEST);

// Make the SW take control immediately
self.skipWaiting();
self.clients.claim();

// Pages we want available offline
const OFFLINE_PAGES = ["/", "/day", "/week"];

// Warm the HTML cache once (first install) so offline reload works
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open("pages");
      // best-effort warm; ignore failures to avoid install abort
      await Promise.all(
        OFFLINE_PAGES.map((url) =>
          fetch(url, { cache: "no-store" })
            .then((res) => res.ok && cache.put(url, res.clone()))
            .catch(() => {})
        )
      );
    })()
  );
});

// Navigations: prefer SSR when online; otherwise serve cached HTML for that path
const navigationHandler = new NetworkFirst({
  cacheName: "pages",
  networkTimeoutSeconds: 3, // optional "fast fallback"
});

registerRoute(
  new NavigationRoute(
    async ({ request, url }) => {
      try {
        const res = await navigationHandler.handle({ request });
        if (res) {
          return res;
        }
      } catch {
        // fall through to cache
      }

      // Normalize trailing slash to maximize hits
      const pathname = url.pathname.endsWith("/")
        ? url.pathname
        : `${url.pathname}/`;
      const candidates = new Set<string>([url.pathname, pathname]);

      // If this route isn’t one of the 3, you can choose a default (e.g., "/")
      for (const u of candidates) {
        const cached = await caches.match(u);
        if (cached) {
          return cached;
        }
        // also check precache (hashed revisioned entries)
        const pc = await matchPrecache(u);
        if (pc) {
          return pc;
        }
      }

      // As a last resort, serve the root shell if present
      const root = (await caches.match("/")) ?? (await matchPrecache("/"));
      return root ?? Response.error();
    },
    { denylist: [/^\/api\//] }
  )
);

// Static same-origin assets (non-navigate)
registerRoute(
  ({ request, sameOrigin, url }) =>
    sameOrigin &&
    request.mode !== "navigate" &&
    !url.pathname.startsWith("/api"),
  new CacheFirst({
    cacheName: "runtime",
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);
