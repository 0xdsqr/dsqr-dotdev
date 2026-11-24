import { AppShell } from '@dsqr-dotdev/react/components/app-shell'
import { ErrorPage, NotFoundPage } from '@dsqr-dotdev/react/components/status-page'
import { siteHead } from '@dsqr-dotdev/react/head'
import { createRootRoute } from '@tanstack/react-router'

const site = 'dsqr studio'

export const Route = createRootRoute({
  head: () => siteHead({ title: 'Studio | dsqr.dev' }),
  shellComponent: AppShell,
  notFoundComponent: () => <NotFoundPage site={site} />,
  errorComponent: () => <ErrorPage site={site} />,
})
