/* Service Worker – Offline shell + Online-updating navigations (plain JS) */
/* eslint-disable no-restricted-globals */

(() => {
  "use strict";

  // Bump VERSION when you want to drop old caches immediately.
  // (Later you can inject this automatically via Vite `define`.)
  const VERSION = "v1" + +Date.now();
  const CACHE_PREFIX = "app-";
  const STATIC_CACHE = `${CACHE_PREFIX}static-${VERSION}`;
  const PAGES_CACHE = `${CACHE_PREFIX}pages-${VERSION}`;

  // We do NOT precache SSR pages. Instead, precache a minimal offline shell.

  // Install: precache offline shell and initial HTML pages
  self.addEventListener("install", (event) => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        // Precache the offline shell for navigation fallbacks
        try {
          await cache.addAll(["/offline"]);
          console.log("📦 Precached offline shell: /offline");
        } catch (e) {
          console.debug("SW: failed to precache offline shell", e);
        }
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
          } catch (e) {
            console.debug("SW: navigationPreload enable failed", e);
          }
        }

        await self.clients.claim();

        // Notify clients that SW is ready and provide a version hint
        const allClients = await self.clients.matchAll({ type: "window" });
        for (const client of allClients) {
          client.postMessage({ type: "SW_READY" });
          client.postMessage({ type: "SW_VERSION", version: VERSION });
        }
      })()
    );
  });

  // Core fetch logic
  self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") {
      return;
    }

    // Skip cross-origin (let the browser handle), and skip your APIs explicitly.
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin) {
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      return;
    }

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
    if (e.data && e.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });

  // ---- Strategies ----------------------------------------------------------

  async function cacheFirst(req, cacheName) {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) {
      console.log("📦 Asset cache HIT:", req.url);
      return hit;
    }

    const resp = await fetch(req);
    if (isCacheable(resp)) {
      // Clone required: response bodies are one-shot
      cache.put(req, resp.clone()).catch(() => {});
      console.log("🛜 Asset fetched & cached:", req.url);
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
    const { pathname } = new URL(req.url);
    const PRIMARY_PAGES = new Set(["/", "/day", "/day/", "/week", "/week/"]);
    console.log("➡️ Navigate:", pathname);

    // 1) Try navigation preload (if enabled) or network
    const preload = event.preloadResponse
      ? event.preloadResponse
      : Promise.resolve(undefined);
    const networkPromise = (async () => {
      const fromPreload = await preload;
      const usedPreload = Boolean(fromPreload);
      const resp = fromPreload || (await fetch(req));
      console.log(
        usedPreload ? "🛰️ Using navigation preload:" : "🛜 Network response:",
        pathname
      );
      if (isCacheable(resp) && !PRIMARY_PAGES.has(pathname)) {
        // Keep a copy for offline for non-primary pages only
        pages.put(req, resp.clone()).catch(() => {});
        console.log("💾 Cached page:", pathname);
      } else if (PRIMARY_PAGES.has(pathname)) {
        console.log("🚫 Skipping cache for primary page:", pathname);
      }
      return resp;
    })();

    // 2) Network-First with timeout → fallback to cached page → fallback to offline shell
    const TIMEOUT_MS = 3000;
    let response;

    try {
      response = await promiseWithTimeout(networkPromise, TIMEOUT_MS);
    } catch (_) {
      console.warn("⏱️ Network timeout, falling back:", pathname);
    }

    if (!response && !PRIMARY_PAGES.has(pathname)) {
      response = await pages.match(req, { ignoreVary: true });
      if (response) {
        console.log("📦 Page cache HIT:", pathname);
      }
    }

    // If the network returned a 404 for an unknown page, serve offline shell
    if (response && response.status === 404) {
      const offline = await caches.match("/offline", { ignoreVary: true });
      if (offline) {
        console.log("🚧 404 encountered, serving offline shell for:", pathname);
        return offline;
      }
    }

    // Final fallback: serve offline shell
    if (!response) {
      response = await caches.match("/offline", { ignoreVary: true });
      if (response) {
        console.log("🧱 Serving offline shell for:", pathname);
      }
    }

    // Ensure we always return *something*
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
