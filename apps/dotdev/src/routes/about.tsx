import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/coming-soon'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About | dsqr.dev' }] }),
  component: () => <ComingSoon title="About" blurb="The long version is still being written. For now, the stage says most of it." />,
})
