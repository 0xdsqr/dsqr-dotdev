import * as pulumi from "@pulumi/pulumi"
import {
  firstDefined,
  MissingPulumiConfigError,
  requireConfigValue,
  type PulumiConfigReader,
} from "@dsqr-dotdev/effect-pulumi"
import { Effect } from "effect"

export type ProxmoxConnectionConfig = {
  endpoint: string
  apiToken: pulumi.Input<string>
  insecure: boolean
}

export type ProxmoxConnectionConfigSource = {
  config?: PulumiConfigReader<pulumi.Input<string>>
  env?: NodeJS.ProcessEnv
}

function requireConfigValueEffect<T>(
  value: T | undefined,
  field: string,
  expected: ReadonlyArray<string>,
) {
  return value !== undefined && value !== ""
    ? Effect.succeed(value)
    : Effect.fail(new MissingPulumiConfigError({ field, expected }))
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
    (firstDefined(env.PROXMOX_INSECURE_SKIP_VERIFY, env.PROXMOX_VE_INSECURE) ?? "true") === "true"
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

    return {
      endpoint,
      apiToken,
      insecure: readInsecure(config, env),
    } satisfies ProxmoxConnectionConfig
  })
}

export function loadProxmoxConnectionConfig(
  source: ProxmoxConnectionConfigSource = {},
): ProxmoxConnectionConfig {
  const { config, env } = resolveSource(source)

  return {
    endpoint: requireConfigValue(readEndpoint(config, env), "endpoint", [
      "proxmox:endpoint",
      "PROXMOX_BASE_URL",
      "PROXMOX_VE_ENDPOINT",
    ]),
    apiToken: requireConfigValue(readApiToken(config, env), "api token", [
      "proxmox:apiToken",
      "PROXMOX_API_TOKEN",
      "PROXMOX_VE_API_TOKEN",
      "PROXMOX_USER + PROXMOX_TOKEN_ID + PROXMOX_TOKEN_SECRET",
    ]),
    insecure: readInsecure(config, env),
  }
}
