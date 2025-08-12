import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  middleware: "src/middleware/sw-headers.ts",
  vite: {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    plugins: [tailwindcss()] as unknown as any,
    server: { headers: { "Service-Worker-Allowed": "/" } },
  },
});
