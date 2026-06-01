import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Front em React (Vite). Em dev, /api é proxiado pro Express na :3000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
