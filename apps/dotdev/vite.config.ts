import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: [
      "dev-dsqr.dev",
      "dsqr.dev",
      "localhost",
      "127.0.0.1",
      "192.168.50.27",
    ],
  },
})

export default config
