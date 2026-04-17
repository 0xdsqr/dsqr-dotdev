const DEFAULT_APP_PORT = "3020"
const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:3020",
  "http://localhost:3021",
  "https://dsqr.dev",
  "https://studio.dsqr.dev",
]

function trimTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function isDevelopmentRuntime() {
  return process.env.NODE_ENV !== "production"
}

function getDefaultLocalBaseUrl() {
  return `http://localhost:${process.env.PORT || DEFAULT_APP_PORT}`
}

export function getPublicBaseUrl() {
  const baseUrl =
    process.env.DOTDEV_BASE_URL ||
    process.env.BETTER_AUTH_URL ||
    (isDevelopmentRuntime() ? getDefaultLocalBaseUrl() : undefined) ||
    process.env.BASE_URL ||
    getDefaultLocalBaseUrl()

  return trimTrailingSlash(baseUrl)
}

export function getTrustedOrigins() {
  const configuredOrigins = (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  return Array.from(new Set([getPublicBaseUrl(), ...DEFAULT_TRUSTED_ORIGINS, ...configuredOrigins]))
}
