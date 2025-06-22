import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(), 
    tailwindcss()
  ],
  server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.50.223',
      'dev-dsqr.dev',
      '.dev-dsqr.dev'
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})