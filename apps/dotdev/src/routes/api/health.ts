import { checkDatabaseHealth, type ComponentHealth } from "@dsqr-dotdev/api"
import { createFileRoute } from "@tanstack/react-router"

const cdnProbeUrl = "https://cdn.dsqr.dev/misc/0xdsqr.asc"

async function checkCdnHealth(): Promise<ComponentHealth> {
  const startedAt = Date.now()

  try {
    const response = await fetch(cdnProbeUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    })
    return { ok: response.ok, latencyMs: Date.now() - startedAt }
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt }
  }
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const [databaseHealth, cdnHealth] = await Promise.all([
          checkDatabaseHealth(),
          checkCdnHealth(),
        ])

        const components = [
          { id: "web", label: "web", ok: true, latencyMs: 0 },
          { id: "database", label: "database", ...databaseHealth },
          { id: "cdn", label: "cdn", ...cdnHealth },
        ]

        return Response.json(
          {
            status: components.every((component) => component.ok) ? "ok" : "degraded",
            components,
            timestamp: new Date().toISOString(),
          },
          { headers: { "Cache-Control": "no-store" } },
        )
      },
    },
  },
})
