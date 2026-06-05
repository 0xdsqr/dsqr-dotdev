import { defineNitroConfig } from "nitro/config"

export default defineNitroConfig({
  preset: "node-server",
  renderer: false,
  // Conservative, app-wide security headers. CSP is intentionally omitted here
  // (needs per-app tuning for inline styles/scripts) and HSTS is terminated at
  // the ingress/CDN.
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
  publicAssets: [
    {
      baseURL: "/",
      dir: "./dist",
      maxAge: 31536000,
    },
  ],
  handlers: [
    {
      route: "/healthz",
      handler: "./server/routes/healthz.ts",
    },
    {
      route: "/**",
      handler: "./server/routes/[...].ts",
    },
  ],
})
