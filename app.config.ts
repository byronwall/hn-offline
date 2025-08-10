import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    plugins: [
      tailwindcss(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        injectRegister: "auto",
        registerType: "autoUpdate",
        devOptions: { enabled: false }, // test offline only on build+preview
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
