import type {
  VaultAuditConfig,
  VaultExternalSecretsPolicyConfig,
  VaultHumanAdminPolicyConfig,
  VaultKvMountConfig,
  VaultSecretPathInventory,
} from "../../packages/effect-pulumi/vault/src/index.ts"

const kv = {
  path: "kv",
  description: "Homelab KV v2 secrets managed by Vault.",
  maxVersions: 10,
  casRequired: false,
} satisfies VaultKvMountConfig

const secretPaths = {
  dotdevWeb: {
    path: "homelab/apps/dsqr/dotdev-web",
    description: "Runtime secrets for dsqr.dev web and shared dsqr app workloads.",
    fields: ["AUTH_SECRET", "DATABASE_URL", "RESEND_API_KEY", "S3_ACCESS_KEY", "S3_SECRET_KEY"],
  },
  dotdevStudio: {
    path: "homelab/apps/dsqr/dotdev-studio",
    description: "Reserved runtime secret path for studio.dsqr.dev.",
    fields: ["AUTH_SECRET", "DATABASE_URL", "RESEND_API_KEY", "S3_ACCESS_KEY", "S3_SECRET_KEY"],
  },
  dotdevLabs: {
    path: "homelab/apps/dsqr/dotdev-labs",
    description: "Reserved runtime secret path for labs.dsqr.dev.",
    fields: ["AUTH_SECRET", "DATABASE_URL", "RESEND_API_KEY", "S3_ACCESS_KEY", "S3_SECRET_KEY"],
  },
  fidaraApi: {
    path: "homelab/apps/fidara/api",
    description: "Runtime secrets for the Fidara API.",
    fields: ["DATABASE_URL", "FIDARA_API_KEY_PEPPER", "FIDARA_API_KEYS"],
  },
  fidaraWeb: {
    path: "homelab/apps/fidara/web",
    description: "Runtime secrets for the Fidara web app.",
    fields: [
      "BETTER_AUTH_SECRET",
      "DATABASE_URL",
      "FIDARA_API_KEY_PEPPER",
      "FIDARA_INTERNAL_API_KEY",
    ],
  },
  tastingsWithTayShared: {
    path: "homelab/apps/tastingswithtay/shared",
    description: "Shared runtime secrets for Tastings with Tay workloads.",
    fields: [
      "AUTH_SECRET",
      "DATABASE_URL",
      "DISCORD_CLIENT_SECRET",
      "S3_ACCESS_KEY",
      "S3_SECRET_KEY",
    ],
  },
  tastingsWithTayWeb: {
    path: "homelab/apps/tastingswithtay/web",
    description: "Runtime secrets for the Tastings with Tay public web app.",
    fields: [
      "AUTH_SECRET",
      "DATABASE_URL",
      "DISCORD_CLIENT_SECRET",
      "S3_ACCESS_KEY",
      "S3_SECRET_KEY",
    ],
  },
  tastingsWithTayAdmin: {
    path: "homelab/apps/tastingswithtay/admin",
    description: "Runtime secrets for the Tastings with Tay admin app.",
    fields: [
      "AUTH_SECRET",
      "DATABASE_URL",
      "DISCORD_CLIENT_SECRET",
      "S3_ACCESS_KEY",
      "S3_SECRET_KEY",
    ],
  },
  argocdFidaraRepo: {
    path: "homelab/platform/argocd/repos/fidara",
    description: "Argo CD private repository credentials for Fidara.",
    fields: ["type", "url", "username", "password"],
  },
  githubHomelabToken: {
    path: "homelab/platform/github/homelab-token",
    description: "Temporary shared GitHub token while narrower tokens are split out.",
    fields: ["token"],
  },
  githubGhcrPull: {
    path: "homelab/platform/github/ghcr-pull",
    description:
      "Canonical GHCR pull credentials rendered into namespace dockerconfigjson secrets.",
    fields: ["server", "username", "password", "email"],
  },
  githubArgoRepoRead: {
    path: "homelab/platform/github/argocd-repo-read",
    description: "Canonical GitHub repository read token for Argo CD.",
    fields: ["username", "password"],
  },
  cloudflare: {
    path: "homelab/infra/cloudflare",
    description: "Cloudflare account, zone, tunnel, and API token inputs.",
    fields: [
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_DSQR_DEV_ZONE_ID",
      "CLOUDFLARE_TWT_ZONE_ID",
      "CLOUDFLARE_FIDARA_ZONE_ID",
      "CLOUDFLARE_TUNNEL_SECRET",
    ],
  },
  postgresKhaos: {
    path: "homelab/infra/postgres/srv-lx-khaos",
    description: "Shared Postgres endpoint metadata and administrative credentials for Khaos.",
    fields: ["HOST", "PORT", "ADMIN_DATABASE_URL"],
  },
  postgresGrafana: {
    path: "homelab/infra/postgres/srv-lx-khaos/databases/grafana",
    description: "Grafana database credentials on Khaos Postgres.",
    fields: ["DATABASE_URL", "PGUSER", "PGPASSWORD"],
  },
  postgresFidara: {
    path: "homelab/infra/postgres/srv-lx-khaos/databases/fidara",
    description: "Fidara database credentials on Khaos Postgres.",
    fields: ["DATABASE_URL", "PGUSER", "PGPASSWORD"],
  },
  postgresFidaraDev: {
    path: "homelab/infra/postgres/srv-lx-khaos/databases/fidara_dev",
    description: "Fidara development database credentials on Khaos Postgres.",
    fields: ["DATABASE_URL", "PGUSER", "PGPASSWORD"],
  },
  postgresTastingsWithTay: {
    path: "homelab/infra/postgres/srv-lx-khaos/databases/tastingswithtay",
    description: "Tastings with Tay database credentials on Khaos Postgres.",
    fields: ["DATABASE_URL", "PGUSER", "PGPASSWORD"],
  },
  postgresDsqrDotdev: {
    path: "homelab/infra/postgres/srv-lx-khaos/databases/dsqr-dotdev",
    description: "dsqr.dev database credentials on Khaos Postgres.",
    fields: ["DATABASE_URL", "PGUSER", "PGPASSWORD"],
  },
  postgresTcgPriceGuide: {
    path: "homelab/infra/postgres/srv-lx-khaos/databases/tcg-price-guide",
    description: "TCG price guide database credentials on Khaos Postgres.",
    fields: ["DATABASE_URL", "PGUSER", "PGPASSWORD"],
  },
  rustfsKhaos: {
    path: "homelab/infra/rustfs/srv-lx-khaos",
    description: "RustFS endpoint and root access credentials.",
    fields: ["S3_ENDPOINT", "S3_REGION", "S3_ACCESS_KEY", "S3_SECRET_KEY"],
  },
  vaultKhaos: {
    path: "homelab/infra/vault/srv-lx-khaos",
    description: "Vault endpoint metadata only. Do not store root token or unseal keys here.",
    fields: ["VAULT_ADDR"],
  },
} satisfies VaultSecretPathInventory

const humanAdminPolicy = {
  name: "homelab-human-admin",
} satisfies VaultHumanAdminPolicyConfig

const audit = {
  enabled: true,
  type: "file",
  path: "file",
  description: "Homelab Vault audit log.",
  options: {
    file_path: "/var/lib/vault/audit.log",
  },
} satisfies VaultAuditConfig

const externalSecretsPolicies = {
  dotdevWeb: {
    name: "homelab-external-secrets-dotdev-web",
    readPaths: [secretPaths.dotdevWeb.path],
  },
  dotdevStudio: {
    name: "homelab-external-secrets-dotdev-studio",
    readPaths: [secretPaths.dotdevStudio.path],
  },
  dotdevLabs: {
    name: "homelab-external-secrets-dotdev-labs",
    readPaths: [secretPaths.dotdevLabs.path],
  },
  fidaraApi: {
    name: "homelab-external-secrets-fidara-api",
    readPaths: [secretPaths.fidaraApi.path],
  },
  fidaraWeb: {
    name: "homelab-external-secrets-fidara-web",
    readPaths: [secretPaths.fidaraWeb.path],
  },
  tastingsWithTayShared: {
    name: "homelab-external-secrets-tastingswithtay-shared",
    readPaths: [secretPaths.tastingsWithTayShared.path],
  },
  tastingsWithTayWeb: {
    name: "homelab-external-secrets-tastingswithtay-web",
    readPaths: [secretPaths.tastingsWithTayWeb.path],
  },
  tastingsWithTayAdmin: {
    name: "homelab-external-secrets-tastingswithtay-admin",
    readPaths: [secretPaths.tastingsWithTayAdmin.path],
  },
  argocdFidaraRepo: {
    name: "homelab-external-secrets-argocd-fidara-repo",
    readPaths: [secretPaths.argocdFidaraRepo.path],
  },
  githubArgoRepoRead: {
    name: "homelab-external-secrets-github-argocd-repo-read",
    readPaths: [secretPaths.githubArgoRepoRead.path],
  },
  githubGhcrPull: {
    name: "homelab-external-secrets-github-ghcr-pull",
    readPaths: [secretPaths.githubGhcrPull.path],
  },
} satisfies Readonly<Record<string, VaultExternalSecretsPolicyConfig>>

export const vault = {
  kv,
  secretPaths,
  policies: {
    humanAdmin: humanAdminPolicy,
    externalSecrets: externalSecretsPolicies,
  },
  audit,
} as const
