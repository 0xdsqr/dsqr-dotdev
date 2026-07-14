import * as pulumi from "@pulumi/pulumi"
import * as vault from "@pulumi/vault"

import {
  Effect,
  PulumiResourceConfigError,
  firstDefined,
  requireConfigValueEffect,
  runSyncOrThrow,
  type MissingPulumiConfigError,
  type PulumiConfigReader,
} from "@dsqr-dotdev/effect-pulumi-core"

type Environment = Readonly<Record<string, string | undefined>>

export type VaultConnectionConfig = {
  readonly address: pulumi.Input<string>
  readonly token: pulumi.Input<string>
  readonly caCertFile?: pulumi.Input<string> | undefined
  readonly skipTlsVerify?: pulumi.Input<boolean> | undefined
}

export type VaultKvMountConfig = {
  readonly path: string
  readonly description: string
  readonly maxVersions: number
  readonly casRequired: boolean
}

export type VaultSecretPathSpec = {
  readonly path: string
  readonly description: string
  readonly fields: readonly string[]
}

export type VaultSecretPathInventory = Readonly<Record<string, VaultSecretPathSpec>>

export type VaultExternalSecretsPolicyConfig = {
  readonly name: string
  readonly readPaths: readonly string[]
}

export type VaultHumanAdminPolicyConfig = {
  readonly name: string
}

export type VaultAuditConfig = {
  readonly enabled: boolean
  readonly type: "file"
  readonly path: string
  readonly description: string
  readonly options: Readonly<Record<string, string>>
}

export type VaultFoundationArgs = {
  readonly connection: VaultConnectionConfig
  readonly kv: VaultKvMountConfig
  readonly secretPaths: VaultSecretPathInventory
  readonly humanAdminPolicy: VaultHumanAdminPolicyConfig
  readonly externalSecretsPolicies: Readonly<Record<string, VaultExternalSecretsPolicyConfig>>
  readonly audit: VaultAuditConfig
}

type VaultCapability = "create" | "read" | "update" | "delete" | "list" | "sudo"

export function loadVaultConnectionConfigEffect(
  source: {
    readonly config?: PulumiConfigReader<pulumi.Output<string>> | undefined
    readonly env?: Environment | undefined
  } = {},
): Effect.Effect<VaultConnectionConfig, MissingPulumiConfigError | PulumiResourceConfigError> {
  const env = source.env ?? process.env
  const config = source.config ?? new pulumi.Config("vault")

  return Effect.gen(function* () {
    const address = yield* requireConfigValueEffect(
      firstDefined(config.get("address"), env.VAULT_ADDR, env.VAULT_ADDRESS),
      "Vault address",
      ["pulumi config set vault:address <url>", "VAULT_ADDR", "VAULT_ADDRESS"],
    )
    const caCertFile = firstDefined(config.get("caCertFile"), env.VAULT_CACERT)
    const skipTlsVerify = config.getBoolean("skipTlsVerify") ?? env.VAULT_SKIP_VERIFY === "true"
    const allowInsecureLocalDev =
      config.getBoolean("allowInsecureLocalDev") ?? env.VAULT_ALLOW_INSECURE_LOCAL_DEV === "true"

    yield* validateVaultTransportEffect(address, skipTlsVerify, allowInsecureLocalDev)

    const token = yield* requireConfigValueEffect(
      config.getSecret("token") ?? (env.VAULT_TOKEN ? pulumi.secret(env.VAULT_TOKEN) : undefined),
      "Vault token",
      ["pulumi config set --secret vault:token <token>", "VAULT_TOKEN"],
    )

    return {
      address,
      token,
      ...(caCertFile ? { caCertFile } : undefined),
      ...(skipTlsVerify ? { skipTlsVerify } : undefined),
    } satisfies VaultConnectionConfig
  })
}

function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
}

export function validateVaultTransportEffect(
  address: string,
  skipTlsVerify: boolean,
  allowInsecureLocalDev: boolean,
): Effect.Effect<void, PulumiResourceConfigError> {
  return Effect.try({
    try: () => new URL(address),
    catch: () =>
      new PulumiResourceConfigError({
        resource: "vault:connection",
        message: "Vault address must be a valid absolute URL.",
      }),
  }).pipe(
    Effect.flatMap((url) => {
      if (url.username || url.password) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: "vault:connection",
            message: "Vault address must not contain embedded credentials.",
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
            resource: "vault:connection",
            message:
              "Vault requires HTTPS. Plain HTTP is allowed only for an explicitly enabled loopback-only disposable development server.",
          }),
        )
      }

      if (skipTlsVerify && !isExplicitLocalDev) {
        return Effect.fail(
          new PulumiResourceConfigError({
            resource: "vault:connection",
            message:
              "Vault TLS verification cannot be disabled outside an explicitly enabled loopback-only disposable development server.",
          }),
        )
      }

      return Effect.void
    }),
  )
}

export function loadVaultConnectionConfig(
  source: {
    readonly config?: PulumiConfigReader<pulumi.Output<string>> | undefined
    readonly env?: Environment | undefined
  } = {},
): VaultConnectionConfig {
  return runSyncOrThrow(loadVaultConnectionConfigEffect(source))
}

function listLiteral(values: readonly string[]) {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`
}

function policyRule(path: string, capabilities: readonly VaultCapability[]) {
  return [
    `path ${JSON.stringify(path)} {`,
    `  capabilities = ${listLiteral(capabilities)}`,
    "}",
  ].join("\n")
}

type VaultSecretPathOutput = {
  readonly path: string
  readonly kvV2DataPath: string
  readonly fields: readonly string[]
  readonly description: string
}

function relativeKvPathEffect(
  mountPath: string,
  fullPath: string,
): Effect.Effect<string, PulumiResourceConfigError> {
  const prefix = `${mountPath}/`

  if (fullPath.startsWith(prefix)) {
    return Effect.succeed(fullPath.slice(prefix.length))
  }

  return Effect.fail(
    new PulumiResourceConfigError({
      resource: `vault-secret-path:${fullPath}`,
      message: `Vault path "${fullPath}" must live under KV mount "${mountPath}".`,
    }),
  )
}

export function renderKvV2ReadPolicy(mountPath: string, paths: readonly string[]) {
  return paths
    .flatMap((path) => [
      policyRule(`${mountPath}/data/${path}`, ["read"]),
      policyRule(`${mountPath}/metadata/${path}`, ["read"]),
    ])
    .join("\n\n")
}

export function validateExternalSecretsPoliciesEffect(
  policies: Readonly<Record<string, VaultExternalSecretsPolicyConfig>>,
  secretPaths: VaultSecretPathInventory,
): Effect.Effect<void, PulumiResourceConfigError> {
  return Effect.gen(function* () {
    const knownPaths = new Set(Object.values(secretPaths).map((spec) => spec.path))
    const assignedPaths = new Set<string>()
    const policyNames = new Set<string>()

    if (Object.keys(policies).length === 0) {
      return yield* Effect.fail(
        new PulumiResourceConfigError({
          resource: "vault:external-secrets-policies",
          message: "At least one scoped External Secrets policy is required.",
        }),
      )
    }

    for (const [key, policy] of Object.entries(policies)) {
      if (!policy.name || policyNames.has(policy.name)) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource: `vault:external-secrets-policy:${key}`,
            message: `External Secrets policy "${key}" must have a unique non-empty Vault policy name.`,
          }),
        )
      }
      policyNames.add(policy.name)

      if (policy.readPaths.length === 0) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource: `vault:external-secrets-policy:${key}`,
            message: `External Secrets policy "${key}" must contain at least one exact secret path.`,
          }),
        )
      }

      for (const path of policy.readPaths) {
        if (path.includes("*") || path.includes("+")) {
          return yield* Effect.fail(
            new PulumiResourceConfigError({
              resource: `vault:external-secrets-policy:${key}`,
              message: `External Secrets policy "${key}" cannot use wildcard path "${path}".`,
            }),
          )
        }

        if (!knownPaths.has(path)) {
          return yield* Effect.fail(
            new PulumiResourceConfigError({
              resource: `vault:external-secrets-policy:${key}`,
              message: `External Secrets policy "${key}" references unknown secret path "${path}".`,
            }),
          )
        }

        if (assignedPaths.has(path)) {
          return yield* Effect.fail(
            new PulumiResourceConfigError({
              resource: `vault:external-secrets-policy:${key}`,
              message: `Secret path "${path}" is assigned to more than one External Secrets policy.`,
            }),
          )
        }

        assignedPaths.add(path)
      }
    }
  })
}

function humanAdminPolicy(kvMountPath: string) {
  return [
    policyRule(`${kvMountPath}/*`, ["create", "read", "update", "delete", "list", "sudo"]),
    policyRule("sys/mounts", ["read", "list"]),
    policyRule("sys/mounts/*", ["create", "read", "update", "delete", "list", "sudo"]),
    policyRule("sys/auth", ["read", "list"]),
    policyRule("sys/auth/*", ["create", "read", "update", "delete", "list", "sudo"]),
    policyRule("sys/audit", ["read", "list", "sudo"]),
    policyRule("sys/audit/*", ["create", "read", "update", "delete", "list", "sudo"]),
    policyRule("sys/policies/acl", ["read", "list"]),
    policyRule("sys/policies/acl/*", ["create", "read", "update", "delete", "list"]),
    policyRule("auth/token/create", ["create", "update", "sudo"]),
    policyRule("auth/token/lookup", ["update"]),
    policyRule("auth/token/lookup-self", ["read"]),
    policyRule("auth/token/renew-self", ["update"]),
    policyRule("auth/token/revoke-self", ["update"]),
  ].join("\n\n")
}

function secretPathOutputEffect(
  mountPath: string,
  spec: VaultSecretPathSpec,
): Effect.Effect<VaultSecretPathOutput, PulumiResourceConfigError> {
  const fullPath = `${mountPath}/${spec.path}`

  return relativeKvPathEffect(mountPath, fullPath).pipe(
    Effect.map((relativePath) => ({
      path: fullPath,
      kvV2DataPath: `${mountPath}/data/${relativePath}`,
      fields: spec.fields,
      description: spec.description,
    })),
  )
}

export function createVaultFoundationEffect(args: VaultFoundationArgs) {
  return Effect.gen(function* () {
    yield* validateExternalSecretsPoliciesEffect(args.externalSecretsPolicies, args.secretPaths)

    const secretPathEntries = yield* Effect.forEach(
      Object.entries(args.secretPaths),
      ([key, spec]) =>
        secretPathOutputEffect(args.kv.path, spec).pipe(
          Effect.map((secretPath) => [key, secretPath] as const),
        ),
    )

    const provider = new vault.Provider("vault", {
      address: args.connection.address,
      token: args.connection.token,
      ...(args.connection.caCertFile ? { caCertFile: args.connection.caCertFile } : undefined),
      ...(args.connection.skipTlsVerify
        ? { skipTlsVerify: args.connection.skipTlsVerify }
        : undefined),
    })
    const resourceOptions: pulumi.CustomResourceOptions = { provider }

    const kvMount = new vault.Mount(
      "kv",
      {
        path: args.kv.path,
        type: "kv",
        description: args.kv.description,
        options: {
          version: "2",
        },
      },
      resourceOptions,
    )

    const kvConfig = new vault.kv.SecretBackendV2(
      "kv-config",
      {
        mount: kvMount.path,
        maxVersions: args.kv.maxVersions,
        casRequired: args.kv.casRequired,
      },
      { provider, dependsOn: [kvMount] },
    )

    const adminPolicy = new vault.Policy(
      "human-admin-policy",
      {
        name: args.humanAdminPolicy.name,
        policy: humanAdminPolicy(args.kv.path),
      },
      { provider, dependsOn: [kvMount] },
    )

    const externalSecretsPolicies = Object.fromEntries(
      Object.entries(args.externalSecretsPolicies).map(([key, policy]) => {
        const resource = new vault.Policy(
          `external-secrets-policy-${key}`,
          {
            name: policy.name,
            policy: renderKvV2ReadPolicy(args.kv.path, policy.readPaths),
          },
          { provider, dependsOn: [kvMount] },
        )

        return [key, resource.name]
      }),
    )

    const audit = args.audit.enabled
      ? new vault.Audit(
          "audit",
          {
            type: args.audit.type,
            path: args.audit.path,
            description: args.audit.description,
            options: args.audit.options,
          },
          resourceOptions,
        )
      : undefined

    return {
      mounts: {
        kv: {
          path: kvMount.path,
          config: kvConfig.id,
        },
      },
      policies: {
        humanAdmin: adminPolicy.name,
        externalSecrets: externalSecretsPolicies,
      },
      audit: {
        path: audit?.path,
        type: audit?.type,
      },
      secretPaths: Object.fromEntries(secretPathEntries),
    }
  })
}

export function createVaultFoundation(args: VaultFoundationArgs) {
  return runSyncOrThrow(createVaultFoundationEffect(args))
}
