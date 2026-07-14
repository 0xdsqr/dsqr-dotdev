import * as pulumi from "@pulumi/pulumi"
import {
  Effect,
  firstDefined,
  PulumiResourceConfigError,
  requireConfigValueEffect,
  runSyncOrThrow,
  type PulumiConfigReader,
} from "@dsqr-dotdev/effect-pulumi-core"

export type ProxmoxConnectionConfig = {
  endpoint: string
  apiToken: pulumi.Input<string>
  insecure: boolean
}

export type ProxmoxConnectionConfigSource = {
  config?: PulumiConfigReader<pulumi.Input<string>>
  env?: NodeJS.ProcessEnv
}

function resolveSource(source: ProxmoxConnectionConfigSource = {}): {
  config: PulumiConfigReader<pulumi.Input<string>>
  env: NodeJS.ProcessEnv
} {
  return {
    config: source.config ?? new pulumi.Config("proxmox"),
    env: source.env ?? process.env,
  }
}

function readEndpoint(config: PulumiConfigReader<pulumi.Input<string>>, env: NodeJS.ProcessEnv) {
  return firstDefined(config.get("endpoint"), env.PROXMOX_BASE_URL, env.PROXMOX_VE_ENDPOINT)
}

function readApiToken(config: PulumiConfigReader<pulumi.Input<string>>, env: NodeJS.ProcessEnv) {
  return (
    config.getSecret("apiToken") ??
    firstDefined(env.PROXMOX_API_TOKEN, env.PROXMOX_VE_API_TOKEN) ??
    (() => {
      const username = firstDefined(env.PROXMOX_USER, env.PROXMOX_VE_USERNAME)
      const tokenId = env.PROXMOX_TOKEN_ID
      const tokenSecret = env.PROXMOX_TOKEN_SECRET

      if (!username || !tokenId || !tokenSecret) {
        return undefined
      }

      return `${username}!${tokenId}=${tokenSecret}`
    })()
  )
}

function readInsecure(config: PulumiConfigReader<pulumi.Input<string>>, env: NodeJS.ProcessEnv) {
  return (
    config.getBoolean("insecure") ??
    (firstDefined(env.PROXMOX_INSECURE_SKIP_VERIFY, env.PROXMOX_VE_INSECURE) ?? "false") === "true"
  )
}

function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
}

export function validateProxmoxTransportEffect(
  endpoint: string,
  insecure: boolean,
  allowInsecureLocalDev: boolean,
): Effect.Effect<void, PulumiResourceConfigError> {
  return Effect.try({
    try: () => new URL(endpoint),
    catch: () =>
      new PulumiResourceConfigError({
        resource: "proxmox:connection",
        message: "Proxmox endpoint must be a valid absolute URL.",
      }),
  }).pipe(
    Effect.flatMap((url) => {
      if (url.username || url.password) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: "proxmox:connection",
            message: "Proxmox endpoint must not contain embedded credentials.",
          }),
        )
      }

      const isExplicitLocalDev = allowInsecureLocalDev && isLoopbackHostname(url.hostname)

      if (url.protocol === "http:" && isExplicitLocalDev) {
        return Effect.void
      }

      if (url.protocol !== "https:") {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: "proxmox:connection",
            message:
              "Proxmox requires HTTPS. Plain HTTP is allowed only for an explicitly enabled loopback-only disposable development server.",
          }),
        )
      }

      if (insecure && !isExplicitLocalDev) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: "proxmox:connection",
            message:
              "Proxmox TLS verification cannot be disabled outside an explicitly enabled loopback-only disposable development server.",
          }),
        )
      }

      return Effect.void
    }),
  )
}

export function loadProxmoxConnectionConfigEffect(source: ProxmoxConnectionConfigSource = {}) {
  const { config, env } = resolveSource(source)

  return Effect.gen(function* () {
    const endpoint = yield* requireConfigValueEffect(readEndpoint(config, env), "endpoint", [
      "proxmox:endpoint",
      "PROXMOX_BASE_URL",
      "PROXMOX_VE_ENDPOINT",
    ])

    const apiToken = yield* requireConfigValueEffect(readApiToken(config, env), "api token", [
      "proxmox:apiToken",
      "PROXMOX_API_TOKEN",
      "PROXMOX_VE_API_TOKEN",
      "PROXMOX_USER + PROXMOX_TOKEN_ID + PROXMOX_TOKEN_SECRET",
    ])
    const insecure = readInsecure(config, env)
    const allowInsecureLocalDev =
      config.getBoolean("allowInsecureLocalDev") ?? env.PROXMOX_ALLOW_INSECURE_LOCAL_DEV === "true"

    yield* validateProxmoxTransportEffect(endpoint, insecure, allowInsecureLocalDev)

    return {
      endpoint,
      apiToken,
      insecure,
    } satisfies ProxmoxConnectionConfig
  })
}

export function loadProxmoxConnectionConfig(
  source: ProxmoxConnectionConfigSource = {},
): ProxmoxConnectionConfig {
  return runSyncOrThrow(loadProxmoxConnectionConfigEffect(source))
}
