export type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  data?: Record<string, unknown>
  duration?: number
}

const isDev = process.env.NODE_ENV === "development"
const logFormat = process.env.LOG_FORMAT ?? (isDev ? "pretty" : "json")

const SECRET_KEY = /token|secret|password|authorization|cookie|apikey|api_key/i
const EMAIL_KEY = /email/i

function maskEmailValue(value: string): string {
  const [local, domain] = value.split("@")
  if (!local || !domain) {
    return value
  }
  const visible = local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`
  return `${visible}@${domain}`
}

// Recursively walk log payloads so secrets and PII are scrubbed even when nested
// inside objects or arrays — key-name matching alone misses deep structures.
function sanitizeValue(key: string, value: unknown): unknown {
  if (SECRET_KEY.test(key)) {
    return "[redacted]"
  }
  if (EMAIL_KEY.test(key) && typeof value === "string") {
    return maskEmailValue(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item))
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(k, v)]),
    )
  }
  return value
}

function sanitizeData(data: Record<string, unknown> | undefined) {
  if (!data) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, sanitizeValue(key, value)]),
  )
}

function formatPretty(entry: LogEntry): string {
  const { level, timestamp, message, duration, data } = entry
  const levelUpper = level.toUpperCase().padEnd(5)
  const durationStr = duration !== undefined ? ` [${duration}ms]` : ""
  const dataStr = data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ""

  return `[${timestamp}] ${levelUpper} ${message}${durationStr}${dataStr}`
}

function emit(entry: LogEntry) {
  const normalized = {
    ...entry,
    data: sanitizeData(entry.data),
  }
  const line = logFormat === "json" ? JSON.stringify(normalized) : formatPretty(normalized)

  switch (entry.level) {
    case "debug":
      if (isDev) {
        console.debug(line)
      }
      return
    case "warn":
      console.warn(line)
      return
    case "error":
      console.error(line)
      return
    case "info":
    default:
      console.log(line)
  }
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    emit({
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      data,
    })
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    emit({
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      data,
    })
  },

  error: (message: string, data?: Record<string, unknown>) => {
    emit({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      data,
    })
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    emit({
      level: "debug",
      timestamp: new Date().toISOString(),
      message,
      data,
    })
  },

  request: (method: string, path: string, statusCode: number, duration: number) => {
    emit({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `${method} ${path}`,
      duration,
      data: { statusCode },
    })
  },

  trpc: (procedure: string, duration: number, userId?: string) => {
    emit({
      level: "info",
      timestamp: new Date().toISOString(),
      message: "trpc.request",
      duration,
      data: userId ? { procedure, userId } : { procedure },
    })
  },
}
