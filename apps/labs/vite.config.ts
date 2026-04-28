import tailwindcss from "@tailwindcss/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    viteReact(),
    tailwindcss(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3022,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 3022,
    allowedHosts: true,
  },
})
