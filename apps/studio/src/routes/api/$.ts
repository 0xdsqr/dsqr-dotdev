import { appHandler } from '@dsqr-dotdev/api/server'
import { createFileRoute } from '@tanstack/react-router'

const handle = ({ request }: { request: Request }) => appHandler(request)

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: { GET: handle, POST: handle },
  },
})
