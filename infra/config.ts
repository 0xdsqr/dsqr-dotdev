function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable ${name}.`)
  }

  return value
}

function requireCsvEnv(name: string) {
  const values = requireEnv(name)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  if (values.length === 0) {
    throw new Error(`Missing at least one value in required environment variable ${name}.`)
  }

  return values
}

export const cloudflareConfig = {
  accountId: requireEnv("CLOUDFLARE_ACCOUNT_ID"),
  dsqrDevZoneId: requireEnv("CLOUDFLARE_DSQR_DEV_ZONE_ID"),
  tastingswithtayZoneId: requireEnv("CLOUDFLARE_TWT_ZONE_ID"),
  tunnelSecret: requireEnv("CLOUDFLARE_TUNNEL_SECRET"),
  accessAdminEmails: requireCsvEnv("CLOUDFLARE_ACCESS_ADMIN_EMAILS"),
  hetznerMailStack: "0xdsqr/hetzner-mail/dev",
} as const

export const hetznerMailConfig = {
  name: "mail-vps",
  serverType: "cpx11",
  location: "ash",
  image: "ubuntu-24.04",
  sshKeyName: "dsqr-homelab",
  createFirewall: true,
  adminIpv4: "98.156.203.63",
  adminIpv6: "2603:8080:7000:4c14:7400:4c92:47a4:6f56",
  rdnsHostname: "mx.dsqr.dev",
} as const

export const tailscaleConfig = {
  adminUser: "0xdsqr@github",
  openTaggedServerAccess: true,
} as const
