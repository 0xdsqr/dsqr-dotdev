import { Page } from '@dsqr-dotdev/react/components/page'
import { createFileRoute } from '@tanstack/react-router'
import { LabsIntro } from '../components/labs-intro'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <Page site="DSQR Labs LLC" centered>
      <LabsIntro />
    </Page>
  )
}
