import { definePlugin } from 'nitro'
import { disposeHandlers } from './app.server'

/** Closes every Effect runtime (and the database pool) when Nitro shuts down on SIGTERM/SIGINT. */
export default definePlugin((nitro) => {
  nitro.hooks.hook('close', disposeHandlers)
})
