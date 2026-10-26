/* Service worker: an offline app shell for HN Offline.
 *
 * Story data lives in IndexedDB (see src/stores); this worker only makes the
 * app itself load offline:
 * - Pages: network first (3 s timeout). Top, Day, Week, and /offline keep
 *   their last good copy. Other pages offline redirect to /offline, which
 *   routes back to them in the client.
 * - Built assets: cache first. Their file names are content-hashed.
 * - Icons and the web manifest: cache first, refreshed with each version.
 * `pnpm build` stamps VERSION; a new version drops the old caches.
 */
/* eslint-disable no-restricted-globals */

const VERSION = "dev";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const SHELL_PAGES = ["/", "/day", "/week", "/offline"];
// Unhashed files from public/ that the shell loads.
const STATIC_FILES = [
  "/favicon-32x32.png",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all([
        ...SHELL_PAGES.map(cachePageAndAssets),
        cacheBuildManifestAssets(),
        caches
          .open(ASSETS)
          .then((assets) =>
            Promise.all(
              STATIC_FILES.map((f) =>
                assets.add(new Request(f, { cache: "reload" })).catch(() => {})
              )
            )
          ),
      ]);
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
  } else if (
    url.pathname.startsWith("/_build/assets/") ||
    STATIC_FILES.includes(url.pathname)
  ) {
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
    if (res.ok && SHELL_PAGES.includes(pathname)) {
      pages.put(pathname, res.clone()).catch(() => {});
      return res;
    }
  } catch {
    // offline or slow: fall through to the cache
  }
  const hit = await pages.match(pathname);
  if (hit) {
    return hit;
  }
  // Another route's HTML would not hydrate at this URL. Redirect to /offline,
  // which routes back here in the client and reads the story from IndexedDB.
  if (pathname !== "/offline") {
    const next = encodeURIComponent(pathname + new URL(req.url).search);
    return Response.redirect(`/offline?next=${next}`, 302);
  }
  return (
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

// Every client chunk and stylesheet, so routes not linked from the shell
// pages (like /story/:id) also load offline.
async function cacheBuildManifestAssets() {
  try {
    const res = await fetch("/_build/.vite/manifest.json", { cache: "reload" });
    if (!res.ok) {
      return;
    }
    const files = Object.values(await res.json()).flatMap((entry) => [
      entry.file,
      ...(entry.css ?? []),
    ]);
    const assets = await caches.open(ASSETS);
    await Promise.all(
      [...new Set(files)].map((file) =>
        assets.add(`/_build/${file}`).catch(() => {})
      )
    );
  } catch {
    // the shell pages still cache what they link to
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
