import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        port: 5173,
        open: true,
    },
    build: {
        target: "es2020",
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ["three"],
                    r3f: ["@react-three/fiber", "@react-three/drei"],
                    vendor: ["react", "react-dom", "framer-motion"],
                },
            },
        },
    },
    assetsInclude: ["**/*.glb", "**/*.gltf", "**/*.hdr"],
});
