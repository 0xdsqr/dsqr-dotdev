import { fileURLToPath } from 'node:url'
import { staticSecurityHeaders } from '@dsqr-dotdev/react/security'
import stylex from '@stylexjs/unplugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackStart(),
    stylex.vite({ useCSSLayers: true }),
    react(),
    nitro({
      preset: 'node-server',
      plugins: [fileURLToPath(import.meta.resolve('@dsqr-dotdev/api/nitro-plugin'))],
      routeRules: { '/**': { headers: staticSecurityHeaders } },
    }),
  ],
})
