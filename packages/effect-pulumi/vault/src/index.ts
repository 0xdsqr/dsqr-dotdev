import * as pulumi from "@pulumi/pulumi"
import * as vault from "@pulumi/vault"

import {
  firstDefined,
  requireConfigValue,
  type PulumiConfigReader,
} from "@dsqr-dotdev/effect-pulumi"

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
  readonly readPrefixes: readonly string[]
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
  readonly externalSecretsPolicy: VaultExternalSecretsPolicyConfig
  readonly audit: VaultAuditConfig
}

type VaultCapability = "create" | "read" | "update" | "delete" | "list" | "sudo"

export function loadVaultConnectionConfig(
  source: {
    readonly config?: PulumiConfigReader<pulumi.Output<string>> | undefined
    readonly env?: Environment | undefined
  } = {},
): VaultConnectionConfig {
  const env = source.env ?? process.env
  const config = source.config ?? new pulumi.Config("vault")
  const address = requireConfigValue(
    firstDefined(config.get("address"), env.VAULT_ADDR, env.VAULT_ADDRESS),
    "Vault address",
    ["pulumi config set vault:address <url>", "VAULT_ADDR", "VAULT_ADDRESS"],
  )
  const token = requireConfigValue(
    config.getSecret("token") ?? (env.VAULT_TOKEN ? pulumi.secret(env.VAULT_TOKEN) : undefined),
    "Vault token",
    ["pulumi config set --secret vault:token <token>", "VAULT_TOKEN"],
  )
  const caCertFile = firstDefined(config.get("caCertFile"), env.VAULT_CACERT)
  const skipTlsVerify = config.getBoolean("skipTlsVerify") ?? env.VAULT_SKIP_VERIFY === "true"

  return {
    address,
    token,
    ...(caCertFile ? { caCertFile } : undefined),
    ...(skipTlsVerify ? { skipTlsVerify } : undefined),
  }
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

function relativeKvPath(mountPath: string, fullPath: string) {
  const prefix = `${mountPath}/`

  if (!fullPath.startsWith(prefix)) {
    throw new Error(`Vault path "${fullPath}" must live under KV mount "${mountPath}".`)
  }

  return fullPath.slice(prefix.length)
}

function kvV2ReadRules(mountPath: string, prefixes: readonly string[]) {
  return prefixes
    .flatMap((prefix) => [
      policyRule(`${mountPath}/data/${prefix}`, ["read"]),
      policyRule(`${mountPath}/metadata/${prefix}`, ["read", "list"]),
    ])
    .join("\n\n")
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

function secretPathOutput(mountPath: string, spec: VaultSecretPathSpec) {
  const fullPath = `${mountPath}/${spec.path}`

  return {
    path: fullPath,
    kvV2DataPath: `${mountPath}/data/${relativeKvPath(mountPath, fullPath)}`,
    fields: spec.fields,
    description: spec.description,
  }
}

export function createVaultFoundation(args: VaultFoundationArgs) {
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

  const externalSecretsPolicy = new vault.Policy(
    "external-secrets-policy",
    {
      name: args.externalSecretsPolicy.name,
      policy: kvV2ReadRules(args.kv.path, args.externalSecretsPolicy.readPrefixes),
    },
    { provider, dependsOn: [kvMount] },
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
      externalSecrets: externalSecretsPolicy.name,
    },
    audit: {
      path: audit?.path,
      type: audit?.type,
    },
    secretPaths: Object.fromEntries(
      Object.entries(args.secretPaths).map(([key, spec]) => [
        key,
        secretPathOutput(args.kv.path, spec),
      ]),
    ),
  }
}
