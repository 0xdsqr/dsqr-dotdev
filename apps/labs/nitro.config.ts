import { defineNitroConfig } from "nitro/config"

export default defineNitroConfig({
  preset: "node-server",
  renderer: false,
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
