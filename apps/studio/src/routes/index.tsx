import { AppClient } from '@dsqr-dotdev/api/client'
import { HelloPage } from '@dsqr-dotdev/react/components/hello-page'
import { useAtomValue } from '@effect/atom-react'
import { createFileRoute } from '@tanstack/react-router'
import * as AsyncResult from 'effect/unstable/reactivity/AsyncResult'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

const healthAtom = AppClient.query('health', 'health', {})

function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? <LiveHome /> : <StudioPage message="Connecting to the API…" />
}

function LiveHome() {
  const health = useAtomValue(healthAtom)
  const message = AsyncResult.isSuccess(health)
    ? health.value.message
    : AsyncResult.isFailure(health)
      ? 'Unable to connect to the API.'
      : 'Connecting to the API…'
  return <StudioPage message={message} />
}

function StudioPage({ message }: { message: string }) {
  return <HelloPage site="dsqr studio" title="Hello, studio." message={message} />
}
