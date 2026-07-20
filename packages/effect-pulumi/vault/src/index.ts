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

export type VaultLegacyExternalSecretsPolicyConfig = {
  readonly name: string
  readonly readPrefixes: readonly string[]
}

export type VaultKubernetesAuthRoleConfig = {
  readonly backend: string
  readonly roleName: string
  readonly boundServiceAccountNames: readonly string[]
  readonly boundServiceAccountNamespaces: readonly string[]
  readonly tokenTtlSeconds: number
  readonly tokenMaxTtlSeconds: number
  readonly tokenExplicitMaxTtlSeconds: number
}

export type VaultHumanAdminPolicyConfig = {
  readonly name: string
}

export type VaultPkiAppRoleConfig = {
  readonly backend: string
  readonly roleName: string
  readonly secretIdBoundCidrs: readonly string[]
  readonly tokenBoundCidrs: readonly string[]
  readonly secretIdNumUses: number
  readonly secretIdTtlSeconds: number
  readonly tokenTtlSeconds: number
  readonly tokenMaxTtlSeconds: number
  readonly tokenExplicitMaxTtlSeconds: number
  readonly tokenNumUses: number
}

export type VaultPkiIssuerConfig = {
  readonly backend: string
  readonly roleName: string
  readonly policyName: string
  readonly allowedDomains: readonly string[]
  readonly allowWildcardCertificates: boolean
  readonly generateLease: boolean
  readonly ttlHours: number
  readonly maxTtlHours: number
  readonly appRole?: VaultPkiAppRoleConfig | undefined
}

export type VaultPkiIssuerInventory = Readonly<Record<string, VaultPkiIssuerConfig>>

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
  readonly legacyExternalSecretsPolicy: VaultLegacyExternalSecretsPolicyConfig
  readonly externalSecretsPolicies: Readonly<Record<string, VaultExternalSecretsPolicyConfig>>
  readonly externalSecretsKubernetesRole: VaultKubernetesAuthRoleConfig
  readonly pkiIssuers: VaultPkiIssuerInventory
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

export function renderKvV2PrefixReadPolicy(mountPath: string, prefixes: readonly string[]) {
  return prefixes
    .flatMap((prefix) => [
      policyRule(`${mountPath}/data/${prefix}`, ["read"]),
      policyRule(`${mountPath}/metadata/${prefix}`, ["read", "list"]),
    ])
    .join("\n\n")
}

export function renderPkiIssuePolicy(backend: string, roleName: string) {
  return policyRule(`${backend}/issue/${roleName}`, ["create", "update"])
}

function isDnsName(value: string) {
  if (value.length === 0 || value.length > 253 || value !== value.toLowerCase()) {
    return false
  }

  const labels = value.split(".")

  return (
    labels.length >= 2 &&
    labels.every(
      (label) =>
        label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  )
}

function isBroadCidr(value: string) {
  return value === "0.0.0.0/0" || value === "::/0"
}

export function validatePkiIssuerInventoryEffect(
  issuers: VaultPkiIssuerInventory,
): Effect.Effect<void, PulumiResourceConfigError> {
  return Effect.gen(function* () {
    const roleNames = new Set<string>()
    const policyNames = new Set<string>()
    const appRoleNames = new Set<string>()

    if (Object.keys(issuers).length === 0) {
      return yield* Effect.fail(
        new PulumiResourceConfigError({
          resource: "vault:pki-issuers",
          message: "At least one scoped PKI issuer role is required.",
        }),
      )
    }

    for (const [key, issuer] of Object.entries(issuers)) {
      const resource = `vault:pki-issuer:${key}`

      if (!issuer.backend || issuer.backend.includes("/") || issuer.backend.includes("*")) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" must use a normalized backend mount name.`,
          }),
        )
      }

      if (!issuer.roleName || roleNames.has(issuer.roleName)) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" must have a unique non-empty role name.`,
          }),
        )
      }
      roleNames.add(issuer.roleName)

      if (!issuer.policyName || policyNames.has(issuer.policyName)) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" must have a unique non-empty policy name.`,
          }),
        )
      }
      policyNames.add(issuer.policyName)

      if (
        issuer.allowedDomains.length === 0 ||
        new Set(issuer.allowedDomains).size !== issuer.allowedDomains.length ||
        issuer.allowedDomains.some((domain) => domain.includes("*") || !isDnsName(domain))
      ) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" must use a non-empty, unique list of exact lowercase DNS names.`,
          }),
        )
      }

      if (
        !Number.isInteger(issuer.ttlHours) ||
        !Number.isInteger(issuer.maxTtlHours) ||
        issuer.ttlHours <= 0 ||
        issuer.maxTtlHours < issuer.ttlHours ||
        issuer.maxTtlHours > 720
      ) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" certificate TTLs must be positive whole hours, ordered, and capped at 30 days.`,
          }),
        )
      }

      const appRole = issuer.appRole
      if (!appRole) {
        continue
      }

      if (!appRole.backend || appRole.backend.includes("/") || appRole.backend.includes("*")) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" must use a normalized AppRole backend mount name.`,
          }),
        )
      }

      if (!appRole.roleName || appRoleNames.has(appRole.roleName)) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" must have a unique non-empty AppRole name.`,
          }),
        )
      }
      appRoleNames.add(appRole.roleName)

      if (
        appRole.secretIdBoundCidrs.length === 0 ||
        appRole.tokenBoundCidrs.length === 0 ||
        appRole.secretIdBoundCidrs.some(isBroadCidr) ||
        appRole.tokenBoundCidrs.some(isBroadCidr)
      ) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" AppRole must be bound to explicit, non-global source CIDRs.`,
          }),
        )
      }

      if (
        appRole.secretIdNumUses < 0 ||
        appRole.secretIdTtlSeconds < 0 ||
        appRole.tokenTtlSeconds <= 0 ||
        appRole.tokenMaxTtlSeconds < appRole.tokenTtlSeconds ||
        appRole.tokenExplicitMaxTtlSeconds < appRole.tokenMaxTtlSeconds ||
        appRole.tokenNumUses < 0
      ) {
        return yield* Effect.fail(
          new PulumiResourceConfigError({
            resource,
            message: `PKI issuer "${key}" AppRole has unsafe or internally inconsistent token lifetimes.`,
          }),
        )
      }
    }
  })
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

export function validateExternalSecretsKubernetesRoleEffect(
  role: VaultKubernetesAuthRoleConfig,
): Effect.Effect<void, PulumiResourceConfigError> {
  return Effect.gen(function* () {
    const resource = "vault:external-secrets-kubernetes-role"

    if (!role.backend || role.backend.includes("/") || role.backend.includes("*")) {
      return yield* Effect.fail(
        new PulumiResourceConfigError({
          resource,
          message: "External Secrets must use a normalized Kubernetes auth backend mount name.",
        }),
      )
    }

    if (!role.roleName) {
      return yield* Effect.fail(
        new PulumiResourceConfigError({
          resource,
          message: "External Secrets must use a non-empty Kubernetes auth role name.",
        }),
      )
    }

    if (
      role.boundServiceAccountNames.length === 0 ||
      role.boundServiceAccountNamespaces.length === 0 ||
      role.boundServiceAccountNames.includes("*") ||
      role.boundServiceAccountNamespaces.includes("*")
    ) {
      return yield* Effect.fail(
        new PulumiResourceConfigError({
          resource,
          message:
            "External Secrets Kubernetes auth must bind exact service accounts and namespaces.",
        }),
      )
    }

    if (
      role.tokenTtlSeconds <= 0 ||
      role.tokenMaxTtlSeconds < role.tokenTtlSeconds ||
      role.tokenExplicitMaxTtlSeconds < role.tokenMaxTtlSeconds ||
      role.tokenExplicitMaxTtlSeconds > 3_600
    ) {
      return yield* Effect.fail(
        new PulumiResourceConfigError({
          resource,
          message:
            "External Secrets Kubernetes auth tokens must be ordered and capped at one hour.",
        }),
      )
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
    yield* validateExternalSecretsKubernetesRoleEffect(args.externalSecretsKubernetesRole)
    yield* validatePkiIssuerInventoryEffect(args.pkiIssuers)

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
    const protectedPkiResourceOptions: pulumi.CustomResourceOptions = { provider, protect: true }

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

    const legacyExternalSecretsPolicy = new vault.Policy(
      "external-secrets-policy",
      {
        name: args.legacyExternalSecretsPolicy.name,
        policy: renderKvV2PrefixReadPolicy(
          args.kv.path,
          args.legacyExternalSecretsPolicy.readPrefixes,
        ),
      },
      { provider, dependsOn: [kvMount], protect: true },
    )

    const externalSecretsKubernetesRole = new vault.kubernetes.AuthBackendRole(
      "external-secrets-kubernetes-role-hub-a",
      {
        backend: args.externalSecretsKubernetesRole.backend,
        roleName: args.externalSecretsKubernetesRole.roleName,
        boundServiceAccountNames: [...args.externalSecretsKubernetesRole.boundServiceAccountNames],
        boundServiceAccountNamespaces: [
          ...args.externalSecretsKubernetesRole.boundServiceAccountNamespaces,
        ],
        tokenExplicitMaxTtl: args.externalSecretsKubernetesRole.tokenExplicitMaxTtlSeconds,
        tokenMaxTtl: args.externalSecretsKubernetesRole.tokenMaxTtlSeconds,
        tokenNoDefaultPolicy: true,
        tokenNumUses: 0,
        tokenPolicies: Object.values(externalSecretsPolicies),
        tokenTtl: args.externalSecretsKubernetesRole.tokenTtlSeconds,
        tokenType: "service",
      },
      {
        provider,
        protect: true,
      },
    )

    const pkiIssuers = Object.fromEntries(
      Object.entries(args.pkiIssuers).map(([key, issuer]) => {
        const role = new vault.pkisecret.SecretBackendRole(
          `pki-issuer-role-${key}`,
          {
            backend: issuer.backend,
            name: issuer.roleName,
            allowedDomains: [...issuer.allowedDomains],
            allowAnyName: false,
            allowBareDomains: true,
            allowGlobDomains: false,
            allowIpSans: false,
            allowLocalhost: false,
            allowSubdomains: false,
            allowWildcardCertificates: issuer.allowWildcardCertificates,
            allowedDomainsTemplate: false,
            clientFlag: false,
            cnValidations: ["hostname"],
            codeSigningFlag: false,
            emailProtectionFlag: false,
            enforceHostnames: true,
            extKeyUsages: ["ServerAuth"],
            generateLease: issuer.generateLease,
            issuerRef: "default",
            keyBits: 2_048,
            keyType: "rsa",
            keyUsages: ["DigitalSignature", "KeyEncipherment"],
            maxTtl: `${issuer.maxTtlHours}h`,
            noStore: false,
            noStoreMetadata: false,
            notBeforeDuration: "30s",
            requireCn: true,
            serverFlag: true,
            ttl: `${issuer.ttlHours}h`,
          },
          protectedPkiResourceOptions,
        )

        const policy = new vault.Policy(
          `pki-issuer-policy-${key}`,
          {
            name: issuer.policyName,
            policy: renderPkiIssuePolicy(issuer.backend, issuer.roleName),
          },
          { ...protectedPkiResourceOptions, dependsOn: [role] },
        )

        const appRole = issuer.appRole
          ? new vault.approle.AuthBackendRole(
              `pki-issuer-approle-${key}`,
              {
                backend: issuer.appRole.backend,
                roleName: issuer.appRole.roleName,
                bindSecretId: true,
                localSecretIds: false,
                secretIdBoundCidrs: [...issuer.appRole.secretIdBoundCidrs],
                secretIdNumUses: issuer.appRole.secretIdNumUses,
                secretIdTtl: issuer.appRole.secretIdTtlSeconds,
                tokenBoundCidrs: [...issuer.appRole.tokenBoundCidrs],
                tokenExplicitMaxTtl: issuer.appRole.tokenExplicitMaxTtlSeconds,
                tokenMaxTtl: issuer.appRole.tokenMaxTtlSeconds,
                tokenNoDefaultPolicy: true,
                tokenNumUses: issuer.appRole.tokenNumUses,
                tokenPolicies: [policy.name],
                tokenTtl: issuer.appRole.tokenTtlSeconds,
                tokenType: "batch",
              },
              { ...protectedPkiResourceOptions, dependsOn: [role, policy] },
            )
          : undefined

        return [
          key,
          {
            backend: role.backend,
            roleName: role.name,
            policyName: policy.name,
            appRole: appRole
              ? {
                  backend: appRole.backend,
                  roleName: appRole.roleName,
                  roleId: appRole.roleId,
                }
              : undefined,
          },
        ]
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
        legacyExternalSecrets: legacyExternalSecretsPolicy.name,
        externalSecrets: externalSecretsPolicies,
        pkiIssuers: Object.fromEntries(
          Object.entries(pkiIssuers).map(([key, issuer]) => [key, issuer.policyName]),
        ),
      },
      externalSecretsKubernetesRole: {
        backend: externalSecretsKubernetesRole.backend,
        roleName: externalSecretsKubernetesRole.roleName,
        policies: externalSecretsKubernetesRole.tokenPolicies,
      },
      pkiIssuers,
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
