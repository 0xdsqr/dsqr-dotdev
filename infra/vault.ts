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
  externalSecretsPolicy: vault.policies.externalSecrets,
  audit: vault.audit,
})

export const kvMount = foundation.mounts.kv
export const policies = foundation.policies
export const audit = foundation.audit
export const secretPaths = foundation.secretPaths
