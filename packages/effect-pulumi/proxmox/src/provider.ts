import * as proxmox from "@muhlba91/pulumi-proxmoxve"
import * as pulumi from "@pulumi/pulumi"

import type { ProxmoxConnectionConfig } from "./config.ts"

export function createProxmoxProvider(name: string, connection: ProxmoxConnectionConfig) {
  return new proxmox.Provider(name, {
    endpoint: connection.endpoint,
    apiToken: pulumi.secret(connection.apiToken),
    insecure: connection.insecure,
  })
}
