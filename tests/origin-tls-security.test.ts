import { strict as assert } from "node:assert"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { Effect } from "effect"

import { validatePkiIssuerInventoryEffect } from "../packages/effect-pulumi/vault/src/index.ts"
import { cloudflare } from "../infra/inventory/cloudflare.ts"
import { vault } from "../infra/inventory/vault.ts"

test("Cloudflare Traefik origins use exact SNI names covered by the Vault issuer", () => {
  const allowedDomains = new Set(vault.pkiIssuers.hubATraefikOrigin.allowedDomains)
  const traefikRules = cloudflare.ingressRules.filter(
    (rule) => rule.service === "https://10.10.30.200",
  )

  assert.ok(traefikRules.length > 0)

  for (const rule of traefikRules) {
    const originRequest = (
      rule as {
        readonly originRequest?: {
          readonly httpHostHeader?: string
          readonly originServerName?: string
        }
      }
    ).originRequest

    assert.equal(originRequest?.httpHostHeader, rule.hostname)
    assert.equal(originRequest?.originServerName, rule.hostname)
    assert.ok(allowedDomains.has(rule.hostname))
  }
})

test("Traefik certificate issuance uses a dedicated exact Kubernetes identity", () => {
  const traefikKubernetesAuthRole = vault.pkiIssuers.hubATraefikOrigin.kubernetesAuthRole

  assert.equal(traefikKubernetesAuthRole.roleName, "hub-a-traefik-origin-issuer")
  assert.deepEqual(traefikKubernetesAuthRole.boundServiceAccountNames, ["traefik-origin-issuer"])
  assert.deepEqual(traefikKubernetesAuthRole.boundServiceAccountNamespaces, ["traefik"])

  const wildcardKubernetesBinding = Effect.runSync(
    Effect.flip(
      validatePkiIssuerInventoryEffect({
        unsafe: {
          ...vault.pkiIssuers.hubATraefikOrigin,
          kubernetesAuthRole: {
            ...traefikKubernetesAuthRole,
            boundServiceAccountNamespaces: ["*"],
          },
        },
      }),
    ),
  )

  assert.match(wildcardKubernetesBinding.message, /bind exact service accounts and namespaces/)
})

test("hub-a Traefik declarations pin the VIP and materialize the exact Vault certificate", () => {
  const values = readFileSync(
    new URL("../gitops/manifests/traefik/overlays/hub-a/values-overrides.yaml", import.meta.url),
    "utf8",
  )
  const generator = readFileSync(
    new URL(
      "../gitops/manifests/external-secrets-config/base/hub-a-traefik-origin.vaultdynamicsecret.yaml",
      import.meta.url,
    ),
    "utf8",
  )
  const externalSecret = readFileSync(
    new URL(
      "../gitops/manifests/external-secrets-config/base/hub-a-traefik-origin.externalsecret.yaml",
      import.meta.url,
    ),
    "utf8",
  )

  assert.match(values, /metallb\.io\/address-pool: ingress/)
  assert.match(values, /metallb\.io\/loadBalancerIPs: 10\.10\.30\.200/)
  assert.match(values, /secretName: hub-a-traefik-origin-tls/)
  assert.match(generator, /server: https:\/\/vault\.service\.home\.arpa:8200/)
  assert.match(generator, /role: hub-a-traefik-origin-issuer/)
  assert.match(generator, /name: traefik-origin-issuer/)
  assert.match(externalSecret, /type: kubernetes\.io\/tls/)

  for (const domain of vault.pkiIssuers.hubATraefikOrigin.allowedDomains) {
    assert.ok(generator.includes(domain), `Vault certificate generator is missing ${domain}`)
  }
})
