import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from '../components/coming-soon'

export const Route = createFileRoute('/misc')({
  head: () => ({ meta: [{ title: 'Misc | dsqr.dev' }] }),
  component: () => <ComingSoon title="Misc" blurb="Odds and ends are coming soon: hardware, Nix, and things that are nice to look at." />,
})
