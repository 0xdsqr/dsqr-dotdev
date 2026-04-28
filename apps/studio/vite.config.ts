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
  },
  ssr: {
    external: ["pg", "pg-native"],
  },
  server: {
    host: "0.0.0.0",
    port: 3021,
    allowedHosts: true,
  },
})
