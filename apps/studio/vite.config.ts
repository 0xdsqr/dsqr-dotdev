import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rolldownOptions: {
      external: ["pg", "pg-native"],
    },
  },
  resolve: {
    alias: [
      {
        find: "@dsqr-dotdev/api/admin",
        replacement: fileURLToPath(new URL("../../packages/api/src/api/admin.ts", import.meta.url)),
      },
      {
        find: "@dsqr-dotdev/api/auth",
        replacement: fileURLToPath(
          new URL("../../packages/api/src/auth/index.ts", import.meta.url),
        ),
      },
      {
        find: "@dsqr-dotdev/api/runtime",
        replacement: fileURLToPath(new URL("../../packages/api/src/runtime.ts", import.meta.url)),
      },
      {
        find: "@dsqr-dotdev/database",
        replacement: fileURLToPath(new URL("../../packages/database/src", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  plugins: [tanstackStart(), viteReact(), tailwindcss(), nitro({ preset: "node-server" })],
  nitro: {
    preset: "node-server",
    rollupConfig: {
      external: ["pg", "pg-native"],
    },
    // App-wide baseline security headers (CSP tuned per-route, HSTS at ingress).
    routeRules: {
      "/**": {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "X-DNS-Prefetch-Control": "off",
        },
      },
    },
  },
  ssr: {
    external: ["pg", "pg-native"],
  },
  server: {
    host: process.env.DEV_HOST?.trim() || "127.0.0.1",
    port: 3021,
  },
})
