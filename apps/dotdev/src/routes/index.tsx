import { createFileRoute } from '@tanstack/react-router'
import { Intro } from '../components/intro'
import { SitePage } from '../components/site-page'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <SitePage centered>
      <Intro />
    </SitePage>
  )
}
