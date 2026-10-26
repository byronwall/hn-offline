import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    // TODO:AS_ANY, @tailwindcss/vite and vinxi ship different Vite plugin types
    plugins: [tailwindcss()] as any,
  },
});
