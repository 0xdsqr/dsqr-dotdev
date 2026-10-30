import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/coming-soon'

export const Route = createFileRoute('/blog')({
  head: () => ({ meta: [{ title: 'Blog | dsqr.dev' }] }),
  component: () => <ComingSoon title="Blog" blurb="Writing is on its way. Subscribe below to hear when the first post lands." />,
})
