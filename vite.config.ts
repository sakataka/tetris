import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-oxc";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  experimental: {
    enableNativePlugin: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
