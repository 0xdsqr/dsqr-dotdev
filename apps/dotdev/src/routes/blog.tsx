import { pageHead } from '@dsqr-dotdev/react/head'
import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/coming-soon'
import { site } from '../site'

export const Route = createFileRoute('/blog')({
  head: () => pageHead({ title: `Blog | ${site.name}`, path: '/blog', origin: site.origin }),
  component: () => (
    <ComingSoon title="Blog" blurb="Writing is on its way. Subscribe below to hear when the first post lands." />
  ),
})
