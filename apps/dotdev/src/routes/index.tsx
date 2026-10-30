import { createFileRoute } from '@tanstack/react-router'
import { Intro } from '../components/intro'
import { SitePage } from '../components/site-page'
import { Theater } from '../theater/theater'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <>
      <Theater />
      <SitePage centered>
        <Intro />
      </SitePage>
    </>
  )
}
