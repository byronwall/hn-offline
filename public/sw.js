/* Service Worker – Offline shell + Online-updating navigations (plain JS) */
/* eslint-disable no-restricted-globals */

(() => {
  "use strict";

  // Bump VERSION when you want to drop old caches immediately.
  // (Later you can inject this automatically via Vite `define`.)
  const VERSION = "v1";
  const CACHE_PREFIX = "app-";
  const STATIC_CACHE = `${CACHE_PREFIX}static-${VERSION}`;
  const PAGES_CACHE = `${CACHE_PREFIX}pages-${VERSION}`;

  const PRECACHE_PAGES = ["/", "/day", "/week"]; // optional: precache real HTML for offline

  // Install: precache offline shell and initial HTML pages
  self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);

        // Precache the key navigations so direct visits work offline.
        // Ignore errors (e.g., if server blocks caching); SW will still install.
        try {
          const pages = await caches.open(PAGES_CACHE);
          await pages.addAll(PRECACHE_PAGES);
        } catch (_) {}
        await self.skipWaiting();
      })()
    );
  });

  // Activate: clean up old cache buckets; enable navigation preload; take control
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const keepNames = new Set([STATIC_CACHE, PAGES_CACHE]);
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((n) => n.startsWith(CACHE_PREFIX) && !keepNames.has(n))
            .map((n) => caches.delete(n))
        );

        // Speed up first navigation while SW is booting
        if (self.registration.navigationPreload) {
          try {
            await self.registration.navigationPreload.enable();
          } catch (_) {}
        }

        await self.clients.claim();
      })()
    );
  });

  // Core fetch logic
  self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    // Skip cross-origin (let the browser handle), and skip your APIs explicitly.
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin) return;
    if (url.pathname.startsWith("/api/")) return;

    // Navigations: Network-First with a short timeout and offline fallbacks.
    if (req.mode === "navigate") {
      event.respondWith(handleNavigation(event));
      return;
    }

    // Static assets: Cache-First (hashed assets will naturally update via new URLs)
    if (["script", "style", "font", "image"].includes(req.destination)) {
      event.respondWith(cacheFirst(req, STATIC_CACHE));
      return;
    }

    // Everything else → default (network)
  });

  // Allow the page to trigger an immediate activation (optional)
  self.addEventListener("message", (e) => {
    if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
  });

  // ---- Strategies ----------------------------------------------------------

  async function cacheFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;

    const resp = await fetch(req);
    if (isCacheable(resp)) {
      // Clone required: response bodies are one-shot
      cache.put(req, resp.clone()).catch(() => {});
    }
    return resp;
  }

  function isCacheable(resp) {
    return (
      resp &&
      resp.ok &&
      (resp.type === "basic" ||
        resp.type === "opaqueredirect" ||
        resp.type === "cors")
    );
  }

  async function handleNavigation(event) {
    const req = event.request;
    const pages = await caches.open(PAGES_CACHE);

    // 1) Try navigation preload (if enabled) or network
    const preload = event.preloadResponse
      ? event.preloadResponse
      : Promise.resolve(undefined);
    const networkPromise = (async () => {
      const fromPreload = await preload;
      const resp = fromPreload || (await fetch(req));
      if (isCacheable(resp)) {
        // Keep a copy for offline; this ensures `/`, `/day`, `/week` are usable offline
        pages.put(req, resp.clone()).catch(() => {});
      }
      return resp;
    })();

    // 2) Network-First with timeout → fallback to cached page → fallback to offline shell
    const TIMEOUT_MS = 3000;
    let response;

    try {
      response = await promiseWithTimeout(networkPromise, TIMEOUT_MS);
    } catch (_) {
      // timed out; fall back to cache
    }

    if (!response) {
      response = await pages.match(req, { ignoreVary: true });
    }

    // Ensure we always return *something* (even if undefined would throw)
    return (
      response ||
      new Response("", {
        status: 504,
        statusText: "Offline and no fallback available",
      })
    );
  }

  function promiseWithTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), ms);
      promise.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        }
      );
    });
  }
})();
