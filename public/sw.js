/* Service worker: an offline app shell for HN Offline.
 *
 * Story data lives in IndexedDB (see src/stores); this worker only makes the
 * app itself load offline:
 * - Pages: network first (3 s timeout), keep the last good copy, fall back to
 *   that copy, then /offline.
 * - Built assets: cache first. Their file names are content-hashed.
 * `pnpm build` stamps VERSION; a new version drops the old caches.
 */
/* eslint-disable no-restricted-globals */

const VERSION = "dev";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const SHELL_PAGES = ["/", "/day", "/week", "/offline"];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all(SHELL_PAGES.map(cachePageAndAssets));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGES, ASSETS]);
      for (const name of await caches.keys()) {
        if (!keep.has(name)) {
          await caches.delete(name);
        }
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only same-origin GETs; server functions always go to the network.
  if (
    req.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/_server")
  ) {
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(handleNavigation(req, url.pathname));
  } else if (url.pathname.startsWith("/_build/assets/")) {
    event.respondWith(cacheFirst(req));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: VERSION });
  }
});

async function handleNavigation(req, pathname) {
  const pages = await caches.open(PAGES);
  try {
    const res = await withTimeout(fetch(req), NETWORK_TIMEOUT_MS);
    if (res.ok) {
      pages.put(pathname, res.clone()).catch(() => {});
      return res;
    }
  } catch {
    // offline or slow: fall through to the cache
  }
  return (
    (await pages.match(pathname)) ??
    (await pages.match("/offline")) ??
    new Response("You are offline.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function cacheFirst(req) {
  const assets = await caches.open(ASSETS);
  const hit = await assets.match(req);
  if (hit) {
    return hit;
  }
  const res = await fetch(req);
  if (res.ok) {
    assets.put(req, res.clone()).catch(() => {});
  }
  return res;
}

// Cache a page and the scripts and styles its HTML loads.
async function cachePageAndAssets(pathname) {
  try {
    const res = await fetch(pathname, { cache: "reload" });
    if (!res.ok) {
      return;
    }
    await (await caches.open(PAGES)).put(pathname, res.clone());
    const html = await res.text();
    const urls = [
      ...html.matchAll(/(?:href|src)="(\/_build\/assets\/[^"]+)"/g),
    ].map((m) => m[1]);
    const assets = await caches.open(ASSETS);
    await Promise.all(
      [...new Set(urls)].map((u) => assets.add(u).catch(() => {}))
    );
  } catch {
    // a missing page only weakens the offline shell
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}
