export type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  data?: Record<string, unknown>
  duration?: number
}

const isDev = process.env.NODE_ENV === "development"

function formatLog(entry: LogEntry): string {
  const { level, timestamp, message, duration, data } = entry
  const levelUpper = level.toUpperCase().padEnd(5)
  const durationStr = duration !== undefined ? ` [${duration}ms]` : ""
  const dataStr =
    data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : ""

  return `[${timestamp}] ${levelUpper} ${message}${durationStr}${dataStr}`
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      data,
    }
    console.log(formatLog(entry))
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      data,
    }
    console.warn(formatLog(entry))
  },

  error: (message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      data,
    }
    console.error(formatLog(entry))
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (!isDev) return

    const entry: LogEntry = {
      level: "debug",
      timestamp: new Date().toISOString(),
      message,
      data,
    }
    console.debug(formatLog(entry))
  },

  request: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
  ) => {
    const entry: LogEntry = {
      level: "info",
      timestamp: new Date().toISOString(),
      message: `${method} ${path}`,
      duration,
      data: { statusCode },
    }
    console.log(formatLog(entry))
  },

  trpc: (procedure: string, duration: number, userId?: string) => {
    const entry: LogEntry = {
      level: "info",
      timestamp: new Date().toISOString(),
      message: `[TRPC] ${procedure}`,
      duration,
      data: userId ? { userId } : undefined,
    }
    console.log(formatLog(entry))
  },
}
