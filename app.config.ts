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
