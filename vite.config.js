import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
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