import { database } from "@dsqr-dotdev/database/client"
import { sql } from "drizzle-orm"

export type ComponentHealth = {
  ok: boolean
  latencyMs: number
}

export async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const startedAt = Date.now()

  try {
    await database.execute(sql`select 1`)
    return { ok: true, latencyMs: Date.now() - startedAt }
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt }
  }
}
