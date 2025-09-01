/* Service Worker – Offline shell + Online-updating navigations (plain JS) */
/* eslint-disable no-restricted-globals */
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";

// Auto update: activate new SW immediately and take control
self.skipWaiting();
clientsClaim();

// Injected by VitePWA (injectManifest): list of build assets to precache
precacheAndRoute(self.__WB_MANIFEST);

(() => {
  "use strict";

  // Bump VERSION when you want to drop old caches immediately.
  // (Later you can inject this automatically via Vite `define`.)
  const VERSION = "v1756731035748";
  const CACHE_PREFIX = "app-";
  const STATIC_CACHE = `${CACHE_PREFIX}static-${VERSION}`;
  const PAGES_CACHE = `${CACHE_PREFIX}pages-${VERSION}`;

  // We precache a minimal offline shell and core navigable pages for offline first-load.

  // Install: precache offline shell and initial HTML pages
  self.addEventListener("install", (event) => {
    console.log("SW: install event");
    event.waitUntil(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        // Precache the offline shell for navigation fallbacks
        try {
          await cache.addAll(["/offline"]);
          console.log("📦 Precached offline shell: /offline");
        } catch (e) {
          console.error(
            "SW: failed to precache offline shell — aborting install to keep previous SW active",
            e
          );
          // Abort install so an existing SW (and its caches) keep serving
          throw e;
        }

        // Precache primary navigable pages so first offline load works
        try {
          const primaryPaths = [
            "/",
            "/day",
            "/week",
            "/story/45018509",
            "/offline",
          ];
          for (const path of primaryPaths) {
            await precachePageAndAssets(path);
          }
          console.log(
            "📦 Precached primary pages and assets: /, /day, /week, /story/45018509"
          );
        } catch (e) {
          console.warn("SW: failed to precache some primary pages/assets", e);
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
    try {
      const u = new URL(req.url);
      console.debug("SW: fetch event", {
        url: req.url,
        mode: req.mode,
        destination: req.destination,
        method: req.method,
        sameOrigin: u.origin === self.location.origin,
        pathname: u.pathname,
      });
    } catch (e) {
      console.debug("SW: fetch event URL parse failed", e);
    }
    if (req.method !== "GET") {
      try {
        const { pathname } = new URL(req.url);
        console.debug("SW: skip non-GET", req.method, pathname);
      } catch (e) {
        console.debug("SW: non-GET URL parse failed", e);
      }
      return;
    }

    // Skip cross-origin (let the browser handle), and skip your APIs explicitly.
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin) {
      console.debug("SW: skip cross-origin", {
        origin: url.origin,
        pathname: url.pathname,
      });
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      console.debug("SW: skip /api request", url.pathname);
      return;
    }
    // Do not bypass /story navigations; handle them so we can provide offline fallbacks

    // Navigations: Network-First with a short timeout and offline fallbacks.
    if (req.mode === "navigate") {
      console.log("SW: handle navigation", url.pathname);
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
    if (!e || !e.data || typeof e.data !== "object") {
      return;
    }
    if (e.data.type === "SKIP_WAITING") {
      self.skipWaiting();
      return;
    }
    if (e.data.type === "GET_VERSION") {
      const source = e.source;
      if (source && typeof source.postMessage === "function") {
        try {
          source.postMessage({ type: "SW_VERSION", version: VERSION });
        } catch (_) {
          // no-op
        }
      } else {
        // Fallback: broadcast to all clients
        self.clients
          .matchAll({ type: "window" })
          .then((all) =>
            all.forEach((client) =>
              client.postMessage({ type: "SW_VERSION", version: VERSION })
            )
          )
          .catch(() => {});
      }
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

  // ---- Precache Helpers ----------------------------------------------------

  async function precachePageAndAssets(pathname) {
    const pages = await caches.open(PAGES_CACHE);
    let resp;
    try {
      // Bypass HTTP cache and old SW caches
      resp = await fetch(new Request(pathname, { cache: "reload" }));
    } catch (e) {
      console.warn("SW: failed to fetch page for precache:", pathname, e);
      return;
    }
    if (!isCacheable(resp)) {
      console.debug("SW: page not cacheable:", pathname, resp?.status);
      return;
    }
    try {
      await pages.put(new Request(pathname, { method: "GET" }), resp.clone());
    } catch (e) {
      console.debug("SW: pages.put failed during precache", pathname, e);
    }

    // Attempt to parse HTML and precache its module/style assets
    let html;
    try {
      html = await resp.clone().text();
    } catch (_) {
      html = undefined;
    }
    if (!html) {
      return;
    }

    const assets = extractAssetUrls(html);
    if (assets.length === 0) {
      return;
    }
    const staticCache = await caches.open(STATIC_CACHE);
    const requests = assets.map((u) => new Request(u, { method: "GET" }));
    try {
      await Promise.all(
        requests.map(async (r) => {
          const hit = await staticCache.match(r, { ignoreVary: true });
          if (!hit) {
            try {
              const res = await fetch(r);
              if (isCacheable(res)) {
                await staticCache.put(r, res.clone());
              }
            } catch (_) {
              // ignore individual asset failures
            }
          }
        })
      );
      console.log("📦 Precached assets for", pathname, assets);
    } catch (e) {
      console.debug("SW: asset precache failed for", pathname, e);
    }
  }

  function extractAssetUrls(html) {
    const urls = new Set();
    const origin = self.location.origin;
    const add = (href) => {
      if (!href) {
        return;
      }
      try {
        const abs = new URL(href, origin);
        if (abs.origin === origin) {
          urls.add(abs.pathname + abs.search);
        }
      } catch (_) {
        // ignore invalid URLs
      }
    };

    // <link rel="modulepreload" href="...">
    for (const m of html.matchAll(
      /<link[^>]+rel=["']modulepreload["'][^>]*href=["']([^"']+)["'][^>]*>/gi
    )) {
      add(m[1]);
    }
    // <link rel="stylesheet" href="...">
    for (const m of html.matchAll(
      /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi
    )) {
      add(m[1]);
    }
    // <link rel="preload" as="style" href="...">
    for (const m of html.matchAll(
      /<link[^>]+rel=["']preload["'][^>]*as=["']style["'][^>]*href=["']([^"']+)["'][^>]*>/gi
    )) {
      add(m[1]);
    }
    // <script type="module" src="...">
    for (const m of html.matchAll(
      /<script[^>]+type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/gi
    )) {
      add(m[1]);
    }
    return Array.from(urls);
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
    console.time && console.time(`[NAV] ${pathname}`);
    let resolution = undefined; // preload | network | page-cache | offline-shell | offline-shell-404 | timeout-504

    // 1) Try navigation preload (if enabled) or network
    const preload = event.preloadResponse
      ? event.preloadResponse
      : Promise.resolve(undefined);
    const networkPromise = (async () => {
      const fromPreload = await preload;
      const usedPreload = Boolean(fromPreload);
      let resp;
      try {
        resp = fromPreload || (await fetch(req));
      } catch (e) {
        console.warn("🛜 Network fetch failed:", pathname, e);
        resp = undefined;
      }
      console.log(
        usedPreload ? "🛰️ Using navigation preload:" : "🛜 Network response:",
        pathname
      );
      if (resp) {
        console.debug("SW: nav response meta", {
          status: resp.status,
          ok: resp.ok,
          type: resp.type,
        });
      }
      resolution = usedPreload ? "preload" : "network";
      if (isCacheable(resp) && !PRIMARY_PAGES.has(pathname)) {
        // Keep a copy for offline for non-primary pages only
        pages.put(req, resp.clone()).catch(() => {});
        console.log("💾 Cached page:", pathname);
      } else if (PRIMARY_PAGES.has(pathname)) {
        console.log("🚫 Skipping cache for primary page:", pathname);
      } else if (!resp) {
        console.debug("SW: nav response not available to cache", pathname);
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
      resolution = "timeout";
    }

    // Try cached page for any navigation if network failed or timed out.
    if (!response) {
      // For primary pages, match the canonical route (without trailing slash differences)
      const canonicalPath =
        pathname.endsWith("/") && pathname.length > 1
          ? pathname.slice(0, -1)
          : pathname;
      const matchReq = PRIMARY_PAGES.has(canonicalPath)
        ? new Request(canonicalPath, { method: "GET" })
        : req;
      response =
        (await pages.match(matchReq, { ignoreVary: true })) ||
        (PRIMARY_PAGES.has(canonicalPath)
          ? await pages.match(canonicalPath, { ignoreVary: true })
          : undefined);
      if (response) {
        console.log("📦 Page cache HIT:", canonicalPath);
        resolution = "page-cache";
      } else {
        console.debug("📦 Page cache MISS:", canonicalPath);
      }
    }

    // If the network returned a 404 for an unknown page, serve offline shell
    if (response && response.status === 404) {
      const offline = await caches.match("/offline", { ignoreVary: true });
      if (offline) {
        console.log("🚧 404 encountered, serving offline shell for:", pathname);
        resolution = "offline-shell-404";
        return offline;
      } else {
        console.debug(
          "SW: offline shell not found while handling 404:",
          pathname
        );
      }
    }

    // Final fallback: serve offline shell
    if (!response) {
      response = await caches.match("/offline", { ignoreVary: true });
      if (response) {
        console.log("🧱 Serving offline shell for:", pathname);
        resolution =
          resolution === "timeout"
            ? "offline-shell"
            : resolution || "offline-shell";
      } else {
        console.warn(
          "SW: offline shell not available in cache, serving inline fallback:",
          pathname
        );
        const offlineHtml =
          '<!doctype html><html><head><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1">' +
          "<title>Offline</title>" +
          "<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#0b1324;color:#e6edf3}main{padding:24px;text-align:center;max-width:640px}h1{font-size:28px;margin:0 0 12px}p{opacity:.85;margin:8px 0}</style>" +
          "</head><body><main>" +
          "<h1>You're offline</h1>" +
          "<p>We couldn't reach the network and no cached page was available.</p>" +
          "<p>Try again once you're back online. The app will refresh automatically.</p>" +
          "</main></body></html>";
        response = new Response(offlineHtml, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
          status: 200,
          statusText: "Offline Fallback",
        });
        resolution = resolution || "inline-offline";
      }
    }

    // Ensure we always return *something*
    const finalResponse =
      response ||
      new Response("", {
        status: 504,
        statusText: "Offline and no fallback available",
      });
    if (!response) {
      resolution = resolution || "timeout-504";
    }
    console.log("✅ Navigation resolved", {
      path: pathname,
      resolution,
      status: finalResponse.status,
    });
    console.timeEnd && console.timeEnd(`[NAV] ${pathname}`);
    return finalResponse;
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
