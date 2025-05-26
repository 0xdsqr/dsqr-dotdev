import { db } from "@dsqr-dotdev/database"
import { sql } from "drizzle-orm"
import { ControllerResponse, HealthStatus } from "../types/response.types.js"

const serverStartTime = Date.now()

const API_VERSION = "0.0.0"

export const healthControllers = {
  checkLiveness: async (): Promise<ControllerResponse> => {
    return {
      status: 204,
      body: {},
    }
  },

  checkReadiness: async (): Promise<ControllerResponse> => {
    try {
      let dbStatus: "up" | "down" = "down"
      let dbLatency = 0

      try {
        const dbStartTime = performance.now()
        await db.execute(sql`SELECT 1`)
        dbLatency = Math.round(performance.now() - dbStartTime)
        dbStatus = "up"
      } catch (error) {
        console.error("Database health check failed:", error)
        dbStatus = "down"
      }

      const uptimeSec = Math.floor((Date.now() - serverStartTime) / 1000)

      const overallStatus: HealthStatus["status"] =
        dbStatus === "up" ? "up" : "degraded"

      const healthStatus: HealthStatus = {
        status: overallStatus,
        version: API_VERSION,
        services: {
          database: {
            status: dbStatus,
            latency_ms: dbLatency,
          },
          api: {
            status: "up",
            uptime_sec: uptimeSec,
          },
        },
        timestamp: new Date().toISOString(),
      }

      const httpStatus =
        overallStatus === "up" ? 200 : overallStatus === "degraded" ? 200 : 503

      return {
        status: httpStatus,
        body: {
          data: healthStatus,
        },
      }
    } catch (error) {
      console.error("Health check failed:", error)
      return {
        status: 500,
        body: {
          errors: [
            {
              status: "500",
              title: "Internal Server Error",
              detail:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            },
          ],
        },
      }
    }
  },
}
