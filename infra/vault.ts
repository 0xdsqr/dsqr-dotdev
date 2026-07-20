import {
  createVaultFoundation,
  loadVaultConnectionConfig,
} from "../packages/effect-pulumi/vault/src/index.ts"
import { vault } from "./inventory/vault.ts"

export const foundation = createVaultFoundation({
  connection: loadVaultConnectionConfig(),
  kv: vault.kv,
  secretPaths: vault.secretPaths,
  humanAdminPolicy: vault.policies.humanAdmin,
  legacyExternalSecretsPolicy: vault.policies.legacyExternalSecrets,
  externalSecretsPolicies: vault.policies.externalSecrets,
  externalSecretsKubernetesRole: vault.externalSecretsKubernetesRole,
  pkiIssuers: vault.pkiIssuers,
  audit: vault.audit,
})

export const kvMount = foundation.mounts.kv
export const policies = foundation.policies
export const externalSecretsKubernetesRole = foundation.externalSecretsKubernetesRole
export const pkiIssuers = foundation.pkiIssuers
export const audit = foundation.audit
export const secretPaths = foundation.secretPaths
