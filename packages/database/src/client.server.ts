import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, type PoolConfig } from 'pg'
import * as schema from './schema.ts'

// Construct at server startup, not module import or build time. The caller owns
// credentials/TLS and closes the pool on shutdown; no connection is global.
export function createDatabase(config: PoolConfig) {
  const pool = new Pool({
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...config,
  })
  return { db: drizzle(pool, { schema }), close: () => pool.end() }
}
