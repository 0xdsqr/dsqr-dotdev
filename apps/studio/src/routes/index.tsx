import { HelloPage } from '@dsqr-dotdev/react/components/hello-page'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { trpc } = Route.useRouteContext()
  const health = useQuery(trpc.health.queryOptions())

  return (
    <HelloPage
      title="Hello, studio."
      message={health.isError
        ? 'Unable to connect to the API.'
        : health.data?.message ?? 'Connecting to the API…'}
    />
  )
}
