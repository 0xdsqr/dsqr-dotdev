import { Page } from '@dsqr-dotdev/react/components/page'
import { createFileRoute } from '@tanstack/react-router'
import { Intro } from '../components/intro'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <Page site="dsqr.dev" centered>
      <Intro />
    </Page>
  )
}
