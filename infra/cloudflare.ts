import * as pulumi from "@pulumi/pulumi"

import { createCloudflareEdge } from "../packages/effect-pulumi/cloudflare/src/index.ts"
import { haven } from "../haven.config.ts"
import { cloudflareConfig } from "./config.ts"

const zoneIds = {
  dsqrDev: cloudflareConfig.dsqrDevZoneId,
  fidaraIo: cloudflareConfig.fidaraZoneId,
  tastingswithtayCom: cloudflareConfig.tastingswithtayZoneId,
} as const satisfies Record<keyof typeof haven.cloudflare.zones, string>

const hetznerMail = new pulumi.StackReference(cloudflareConfig.hetznerMailStack)

const mailIpv4 = hetznerMail.getOutput("ipv4Address")

export const cloudflareEdge = createCloudflareEdge({
  accountId: cloudflareConfig.accountId,
  tunnelSecret: pulumi.secret(cloudflareConfig.tunnelSecret),
  zoneIds,
  zones: haven.cloudflare.zones,
  tunnel: haven.cloudflare.tunnel,
  dnsRecords: [
    {
      zone: "dsqrDev",
      name: haven.cloudflare.mailHostname,
      type: "A",
      content: mailIpv4,
      proxied: false,
      ttl: 1,
    },
    ...haven.cloudflare.dnsRecords,
  ],
  r2Buckets: haven.cloudflare.r2Buckets,
  ingressRules: haven.cloudflare.ingressRules,
})
