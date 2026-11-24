import { pageHead } from '@dsqr-dotdev/react/head'
import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/coming-soon'
import { site } from '../site'

export const Route = createFileRoute('/misc')({
  head: () => pageHead({ title: `Misc | ${site.name}`, path: '/misc', origin: site.origin }),
  component: () => (
    <ComingSoon
      title="Misc"
      blurb="Odds and ends are coming soon: hardware, Nix, and things that are nice to look at."
    />
  ),
})
