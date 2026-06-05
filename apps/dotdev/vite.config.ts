import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["pg", "pg-native"],
    },
  },
  plugins: [
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    nitro({ preset: "node-server" }),
  ],
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
    host: "0.0.0.0",
    port: 3020,
    allowedHosts: true,
  },
})
