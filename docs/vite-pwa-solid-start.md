### Offline-first SolidStart with Vite PWA, Nitro, and client loaders

Building an offline-capable app with SolidStart is delightfully straightforward once you connect three pieces: a Service Worker (via Vite PWA’s injectManifest), Nitro’s header controls, and Solid’s client/server loaders backed by IndexedDB. This post walks through how I wired those up for an offline Hacker News client, and why it let me remove manual refresh buttons from the UI.

![placeholder image of the app offline UI](https://placehold.co/1200x600?text=Offline+UI+Placeholder)

### Dependencies

- **Vite PWA** for generating the Service Worker we control with injectManifest
- **Workbox** for precache/runtime helpers (bundled/used by Vite PWA)
- **localforage** for simple IndexedDB storage

```bash
pnpm add -D vite-plugin-pwa workbox-build workbox-core workbox-precaching
pnpm add localforage
```

### Vite/SolidStart configuration

I use Vite PWA in injectManifest mode. This keeps the Service Worker in my repo (`public/sw.js`) so I can author lifecycle logic, then Vite PWA injects the precache manifest during build.

```ts
// app.config.ts
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        strategies: "injectManifest",
        registerType: "autoUpdate",
        injectRegister: false,
        workbox: undefined,
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],
        },
        srcDir: "public",
        filename: "sw.js",
        manifest: false,
      }),
    ] as any,
  },
});
```

During build, Vite PWA outputs the compiled Service Worker at `/_build/sw.js` alongside your client assets.

### Registering the Service Worker (with a wide scope)

On the client, I register the Service Worker with `scope: "/"` so it can cover all routes and assets. I also forward lifecycle events into a small status store to power UI indicators.

```ts
// src/entry-client.tsx (excerpt)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  (async () => {
    const reg = await navigator.serviceWorker.register("/_build/sw.js", {
      scope: "/",
    });

    // Example: wire up update flow / activation signals
    reg.addEventListener("updatefound", () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          sw.postMessage({ type: "SKIP_WAITING" }); // one-tap update
        }
      });
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_VERSION") {
        // surface version in UI if desired
      }
    });
  })().catch(() => {
    /* no-op */
  });
}

// Track online/offline for UX
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    /* exit offline mode */
  });
  window.addEventListener("offline", () => {
    /* enter offline mode */
  });
}
```

### Nitro adds the critical header for SW scope

Because SolidStart serves via Nitro, the cleanest way to grant the Service Worker a root scope is to set a response header for the built SW path. Create `nitro.config.ts` at the repo root:

```ts
// nitro.config.ts
export default {
  routeRules: {
    "/_build/sw.js": {
      headers: {
        "Service-Worker-Allowed": "/",
        "Cache-Control": "no-cache", // keep sw.js fast-updating
      },
    },
    "/_build/**": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  },
};
```

This works in local dev and in containerized deployments because Nitro serves both dynamic routes and static files. No extra reverse proxy rules are required.

Verification after build:

```bash
node .output/server/index.mjs &
curl -i http://localhost:3000/_build/sw.js | grep -i 'Service-Worker-Allowed'
# Service-Worker-Allowed: /
```

![placeholder image of headers in network panel](https://placehold.co/1200x600?text=Headers+Panel+Placeholder)

### Client/server loaders and IndexedDB caching

The app uses a single `createResource` that resolves on the server to full data (for fast first paint) and on the client to cached content from IndexedDB, falling back to summaries if needed. When server-rendered data arrives, it is persisted to the client cache for later offline use.

```ts
// src/features/storyList/ServerStoryPage.tsx (excerpt)
const [data] = createResource(
  () => props.page,
  async (page) => {
    if (isServer) {
      const fullData = await getTopStories(page);
      return {
        source: "server" as const,
        data: { type: "fullData", data: fullData },
      };
    } else {
      return { source: "client" as const, data: await getContentForPage(page) };
    }
  }
);

createEffect(() => {
  if (data()?.source === "server" && data()?.data.type === "fullData") {
    void persistStoryList(props.page, data()?.data.data);
  }
});
```

For storage, `localforage` is configured once and re-exported to keep usage consistent:

```ts
// src/stores/localforage.ts
import localforage from "localforage";
import { isServer } from "solid-js/web";

if (!isServer) {
  localforage.config({
    driver: localforage.INDEXEDDB,
    name: "hn_next",
    storeName: "keyvaluepairs",
  });
}

export const LOCAL_FORAGE_TO_USE = localforage;
```

This pattern gives you the best of both worlds: SSR delivers a complete page, and the client instantly hydrates from local cache even without network. When connectivity is available, background refreshes update the cache and UI.

### Removing manual refresh buttons (and keeping UX responsive)

With the Service Worker set to `autoUpdate` and a loader that rehydrates from cache, explicit “Refresh” buttons become unnecessary. Updates flow in automatically via SW activation and normal navigation. If you still want a hint of manual control, gate any existing button behind online-only visibility and a subtle activity indicator.

```tsx
// src/components/NavBar.tsx (idea)
<Show when={false /* removed now that SW handles refreshes */}>
  {/* refresh icon / button removed */}
</Show>
```

If you keep it, consider showing it only when online and animating while data is loading (the app previously did this with a small spinning icon).

### Build and deploy

SolidStart (via Vinxi) outputs a Nitro server. In containers, run the node server directly:

```dockerfile
# Dockerfile (runner stage excerpt)
CMD ["node", ".output/server/index.mjs"]
```

On each deploy, rebuild so Nitro picks up `nitro.config.ts` and Vite PWA injects the latest precache manifest. Browsers cache `sw.js` aggressively, so the `no-cache` header above and Vite PWA’s `autoUpdate` help ensure quick rollouts.

### Wrap-up

- Vite PWA’s injectManifest lets you author a real Service Worker and still get manifest injection.
- Nitro’s `routeRules` set `Service-Worker-Allowed: /` for `/_build/sw.js`, unlocking a root scope without a reverse proxy.
- Solid’s unified client/server loader hydrates instantly from IndexedDB, enabling first-class offline UX.
- With those in place, manual refresh UI can be dropped or minimized—users simply get fast, resilient pages.

![placeholder image of final app](https://placehold.co/1200x600?text=Final+App+Placeholder)
