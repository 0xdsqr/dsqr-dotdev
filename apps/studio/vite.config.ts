import { fileURLToPath } from "node:url"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const rootDir = fileURLToPath(new URL(".", import.meta.url))

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
  },
  ssr: {
    external: ["pg", "pg-native"],
  },
  resolve: {
    alias: {
      "#tanstack-start-entry": path.resolve(
        rootDir,
        "../../packages/tanstack-start/tanstack-start-entry.ts",
      ),
      "tanstack-start-injected-head-scripts:v": path.resolve(
        rootDir,
        "../../packages/tanstack-start/tanstack-start-injected-head-scripts.ts",
      ),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3021,
    allowedHosts: true,
  },
})
