import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

  const config = defineConfig({
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['dev-dsqr.dev', 'dsqr.dev', 'localhost', '127.0.0.1', '192.168.50.27'],
    },
  })

export default config
