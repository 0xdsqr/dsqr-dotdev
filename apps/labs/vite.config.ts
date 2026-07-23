import tailwindcss from "@tailwindcss/vite"
import viteReact from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  plugins: [viteReact(), tailwindcss()],
  server: {
    host: process.env.DEV_HOST?.trim() || "127.0.0.1",
    port: 3022,
  },
  preview: {
    host: process.env.DEV_HOST?.trim() || "127.0.0.1",
    port: 3022,
  },
})
