import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    plugins: [
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        devOptions: { enabled: true },
        includeAssets: [
          "/favicon.ico",
          "/apple-touch-icon.png",
          "/android-chrome-192x192.png",
          "/android-chrome-512x512.png",
        ],
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          navigationPreload: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          additionalManifestEntries: [
            { url: "/", revision: "v1" },
            { url: "/day", revision: "v1" },
            { url: "/week", revision: "v1" },
            { url: "/offline.html", revision: "v1" },
          ],
          runtimeCaching: [
            {
              // Cache-first for same-origin, non-API requests (allow localhost in dev)
              urlPattern: ({ request, url, sameOrigin }) =>
                sameOrigin &&
                // Avoid handling document navigations here so Workbox's navigation
                // fallback can respond with offline.html when needed
                request.mode !== "navigate" &&
                !url.pathname.startsWith("/api"),
              handler: "CacheFirst",
              options: {
                cacheName: "runtime",
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },

        manifest: {
          name: "Hacker News: Offline First",
          short_name: "HN Offline",
          start_url: "/day",
          display: "standalone",
          theme_color: "#000000",
          background_color: "#ffffff",
          icons: [
            {
              src: "/favicon.ico",
              sizes: "64x64 32x32 24x24 16x16",
              type: "image/x-icon",
            },
            {
              src: "/android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ] as unknown as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
});
