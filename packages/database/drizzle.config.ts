import { resolve } from 'node:path'
import { defineConfig } from 'drizzle-kit'

// npm workspace scripts run here. This config is deliberately local-only and
// never reads DATABASE_URL. Remote migrations get a separate config when needed.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  schemaFilter: ['app'],
  migrations: { schema: 'app_migrations', table: '__drizzle_migrations' },
  dbCredentials: {
    host: resolve('../../.local/postgres/socket'),
    port: 55432,
    user: 'dsqr_dev',
    database: 'dsqr_dotdev_dev',
    ssl: false,
  },
  strict: true,
})
