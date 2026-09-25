import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },

  server: {
    port: 5173,
    open: true,
  },

  build: {
    target: "es2020",
    sourcemap: false,
  },

  assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.hdr"],
});