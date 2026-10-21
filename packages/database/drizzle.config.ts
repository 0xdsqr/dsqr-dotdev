import { fileURLToPath } from 'node:url'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  schemaFilter: ['app'],
  migrations: { schema: 'app_migrations', table: '__drizzle_migrations' },
  dbCredentials: {
    host: fileURLToPath(new URL('../../.local/postgres/socket', import.meta.url)),
    port: 55432,
    user: 'dsqr_dev',
    database: 'dsqr_dotdev_dev',
    ssl: false,
  },
  strict: true,
})
