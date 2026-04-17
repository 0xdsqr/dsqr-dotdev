const DEFAULT_APP_PORT = "3021"
const DEFAULT_DOTDEV_PORT = "3020"
const DEFAULT_TRUSTED_ORIGINS = [
  "http://localhost:3020",
  "http://localhost:3021",
  "https://dsqr.dev",
  "https://studio.dsqr.dev",
]

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function getDefaultLocalBaseUrl() {
  return `http://localhost:${process.env.PORT || DEFAULT_APP_PORT}`
}

function getDefaultDotdevLocalBaseUrl() {
  return `http://localhost:${DEFAULT_DOTDEV_PORT}`
}

function isDevelopmentRuntime() {
  return process.env.NODE_ENV !== "production"
}

export function getPublicBaseUrl() {
  const baseUrl =
    process.env.STUDIO_BASE_URL ||
    process.env.BETTER_AUTH_URL ||
    (isDevelopmentRuntime() ? getDefaultLocalBaseUrl() : undefined) ||
    process.env.BASE_URL ||
    getDefaultLocalBaseUrl()

  return trimTrailingSlash(baseUrl)
}

export function getInternalApiBaseUrl() {
  const baseUrl =
    process.env.INTERNAL_API_BASE_URL ||
    (isDevelopmentRuntime() ? getDefaultLocalBaseUrl() : undefined) ||
    process.env.STUDIO_BASE_URL ||
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

export function getDotdevBaseUrl() {
  const baseUrl =
    process.env.DOTDEV_BASE_URL ||
    (isDevelopmentRuntime() ? getDefaultDotdevLocalBaseUrl() : undefined) ||
    "https://dsqr.dev"

  return trimTrailingSlash(baseUrl)
}
